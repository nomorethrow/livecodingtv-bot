'use strict';

/**
 * Leaderboard - tracks the number of times a viewer enters the stream.
 * Limits a viewer to update the leaderboard once every 10 minutes.
 *
 * Commands:
 *
 * !top X - Displays the top X viewers
 */

const runtime = require('../utils/Runtime');
const topRegex = /^(\!|\/)top\s(\d{1,2})$/;

module.exports = [{
	types: ['message'],
	regex: topRegex,
	action: function( chat, stanza ) {
		const x = parseInt( topRegex.exec( stanza.message )[2], 10 );

		// Grab users from the leaderboard brain object
		// Map the leaderboard into an array
		let users = runtime.brain.get( 'users' ) || {};
		let userScores = [];
		for ( var username in users ) {
			userScores.push( users[ username ] );
		}

		// Sort the entire leaderboard
		userScores.sort( function(a, b) {
			return a.count < b.count ? -1 : a.count > b.count ? 1 : 0;
		}).reverse();

		// Build the output message
		let msg = `Top ${x} Viewers:\n`;
		for ( let i = 0; i < x; i++ ) {
			const user = userScores[i];
			if ( user ) {
				let viewsText = user.count === 1 ? 'view' : 'views';
				msg += `${i+1}. ${user.username} with ${user.count} ${viewsText}!\n`;
			}
		}
		chat.sendMessage( msg );
	}
}, {
	types: ['presence'],
	regex: /^available$/,
	action: function( chat, stanza ) {
		// Grab the user's score from the leaderboard
		let users = runtime.brain.get( 'users' ) || {};
		let userObj = users[ stanza.user.username ];

		if ( users.length === 0 ) {
			Log.log( 'ERROR! LEADERBOARD IS EMPTY' );
		}

		if ( userObj ) {
			// Rate limit existing viewer
			// Only update leaderboard once every 10 minutes per viewer
			const now = new Date().getTime();
			const minutes = 10;
			if ( now - userObj.time < 1000 * 60 * minutes ) {
				return;
			}

			// Increase the user's count and save to the leaderboard
			userObj.count++;
			userObj.time = now;

			users[ stanza.user.username ] = userObj;
			runtime.brain.set( 'users', users );
		}
	}
}]
