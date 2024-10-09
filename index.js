const axios = require('axios');
const ical = require('ical');
const cron = require('node-cron');

const CALENDAR_URL = 'https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!DISCORD_WEBHOOK_URL) {
  console.error('Please set the DISCORD_WEBHOOK_URL environment variable.');
  process.exit(1);
}

let lastNotifiedHoliday = null;

async function fetchHolidays() {
  try {
    const response = await axios.get(CALENDAR_URL);
    return ical.parseICS(response.data);
  } catch (error) {
    console.error('Error fetching holidays:', error.message);
    return {};
  }
}

function getUpcomingHoliday(events) {
  const now = new Date();
  let upcomingHoliday = null;

  for (const event of Object.values(events)) {
    if (event.type === 'VEVENT' && event.start > now) {
      if (!upcomingHoliday || event.start < upcomingHoliday.start) {
        upcomingHoliday = event;
      }
    }
  }

  return upcomingHoliday;
}

async function sendDiscordNotification(holiday) {
  const message = {
    content: `🎉 Upcoming Holiday: **${holiday.summary}** on <t:${Math.floor(holiday.start.getTime() / 1000)}:D>`,
  };

  try {
    await axios.post(DISCORD_WEBHOOK_URL, message);
    console.log('Discord notification sent successfully.');
    lastNotifiedHoliday = holiday.uid;
  } catch (error) {
    console.error('Error sending Discord notification:', error.message);
  }
}

async function checkAndNotify() {
  const holidays = await fetchHolidays();
  const upcomingHoliday = getUpcomingHoliday(holidays);

  if (upcomingHoliday && upcomingHoliday.uid !== lastNotifiedHoliday) {
    const daysUntilHoliday = Math.ceil((upcomingHoliday.start - new Date()) / (1000 * 60 * 60 * 24));

    if (daysUntilHoliday <= 7) {
      await sendDiscordNotification(upcomingHoliday);
    }
  }
}

// Run the check daily at 9:00 AM
cron.schedule('0 9 * * *', checkAndNotify);

console.log('Holiday Discord Notifier is running. Press Ctrl+C to exit.');

// Initial check on startup
checkAndNotify();