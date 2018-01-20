const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const moment = require('moment');


const http = require('http');
const express = require('express');
const app = express();

const port = process.env.PORT || 5000;

var countdownTime = JSON.parse(fs.readFileSync('timeData/countdownTime.json'), 'utf8');

var setcountdown = "403207108390289418"
var countdownReminder = "403580774315589642"

var countdownReminderChannel;

var duration;

var countdownReminderCheckbox = [];

// Functions
// Calculate the time difference and return the duration that holds days, hours and minutes.
function calcDateDiff(time) {
	var now = new moment();
	var cdDate = new moment(`${time} +0800`, "YYYY-MM-DD HH:mm Z");
	var diffInSeconds = cdDate.diff(now, 'seconds');
	var duration = moment.duration(diffInSeconds, 'seconds')._data;
	return duration;
}

// Add 0 to hours and minutes if it is a single digit number.
function formatTimeString(t) {
	if (parseInt(t) < 10) {
		return `0${t}`;
	} 

	return t;
}

// Save latest time state to file.
function writeToCoutdownTimeFile(countdownTime) {
	fs.writeFile('timeData/countdownTime.json', JSON.stringify(countdownTime), (err) => {
		if (err) console.error(err);
	});
}

// Update bot status
function updateTimeOnStatus() {
	duration = calcDateDiff(countdownTime.time);
	var days = duration.days; 
	var hours = formatTimeString(duration.hours);
	var minutes = formatTimeString(duration.minutes);

	console.log('We are updating the time');
	console.log(`${days} ${hours} ${minutes}`);

	if (parseInt(days) >= 1) {
		console.log('days bigger than 1');
		client.user.setActivity(`Pump in ${duration.days} days ${hours}:${minutes}`);
	} else if (parseInt(duration.minutes) > 0) {
		console.log('days smaller than 1 and minutes are positive');
		client.user.setActivity(`Pump in ${hours}:${minutes}`);
	} else if (parseInt(duration.minutes) < 0){
		console.log('Pump starts now!');
		client.user.setActivity(`Pump now`);
	}

	// FIXIT: This can't work yet 
	//remindCountdown(duration);
 
	// Recall this function every minute. Nice technique.
	setTimeout(updateTimeOnStatus, 36000);
}

function countdownString(time) {
	return "Please be reminded that the countdown will starts in " + time;
}

function checkDidISendBefore(arrNum, time) {
	if (!countdownReminderCheckbox[arrNum]) {
		countdownReminderChannel.send(countdownString("6 hours"));
		countdownReminderCheckbox[arrNum] = true;
	}
}

function remindCountdown(duration) {

	console.log('we are inside of remind countdown');

	if (parseInt(duration.days) <= 0) {

		if (parseInt(duration.hours) === 6) {

			checkDidISendBefore(0, "6 hours");

		} else if (parseInt(duration.hours) === 3) {

			checkDidISendBefore(1, "3 hours");

		} else if (parseInt(duration.hours) === 1) {

			checkDidISendBefore(2, "1 hour");

		} else if (parseInt(duration.hours) <= 0) {

			if (parseInt(duration.minutes) === 30) {

				checkDidISendBefore(3, "30 minutes");

			} else if (parseInt(duration.minutes) === 10) {

				checkDidISendBefore(4, "10 minutes");

			} else if (parseInt(duration.minutes) === 5) {

				checkDidISendBefore(5, "5 minutes");

			} else if (parseInt(duration.minutes) === 3) {

				checkDidISendBefore(6, "3 minutes");
				
			} else if (parseInt(duration.minutes) === 1) {

				checkDidISendBefore(7, "1 minute");
				
			} else if (parseInt(duration.minutes) <= 0) {

				if (parseInt(duration.seconds) === 30) {

					checkDidISendBefore(8, "30 seconds");

				}
			}
		}
	}
}

client.on('ready', () => {
  console.log('Countdown bot am ready!');

  countdownReminderChannel = client.channels.find('id', countdownReminder);

  if (countdownTime.time) {
  	updateTimeOnStatus();
  } else {
  	client.user.setActivity('No pump scheduled');
  }
  
});

client.on('message', message => {
	var msg = message.content.toUpperCase(); // Takes the message, and uppercase it
	var sender = message.author;
	var prefix = "!"; // The text before commands, you can set this to whatever you want
	var cont = message.content.slice(prefix.length).split(" "); // THis slices off the prefix, then puts it in an array.
	var args = cont.slice(1); // This is everything after the command in an array.

	// First, we need to make sure that it isnt reading a message that the bot is sending.
	if (sender.id === "401077833071591424") {
		return; // Cancels the rest of the listener event.
	}

	if (message.channel.id === setcountdown) {
		if (cont[0].toUpperCase() == 'COUNTDOWN') {
			if (!duration) { // If there is duration, you cant set a new countdown
				message.channel.send('Countdown start');

				// Saving date to file so we can reference it later, whenever we restart our apps.
				var cdDate = `${args[0]} ${args[1]}`
				writeToCoutdownTimeFile({
					"time": cdDate
				});

				// We need to update the time here. 
				updateTimeOnStatus();

			} else { // If admin key in countdown when there is a countdown running, prompt here to cancel the old one first.
				message.channel.send('Please cancel the previous countdown first before setting another countdown');
			}
		
		// If 'CANCEL', wash all data save on time file.	
		} else if (msg == prefix + 'CANCEL') {
			message.channel.send('Countdown cancel');
			duration = null;

			client.user.setActivity('No pump scheduled');
			writeToCoutdownTimeFile({});
		}
	}
});

client.login(process.env.BOT_TOKEN);

// set the view engine to ejs
app.set('view engine', 'ejs');

// make express look in the `public` directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', (request, response) => {
    // ejs render automatically looks in the views folder
    response.render('index');
});

app.listen(port, () => {
    // will echo 'Our app is running on http://localhost:5000 when run locally'
    console.log('Our app is running on http://localhost:' + port);
});

setInterval(() => {
  http.get('http://cps-countdown-bot.herokuapp.com');
}, 900000);





