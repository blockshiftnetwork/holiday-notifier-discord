import axios from 'axios';
import ical from 'ical';
import cron from 'node-cron';
import { DateTime } from 'luxon';

const CALENDAR_URL = process.env.CALENDAR_URL || 'https://calendar.google.com/calendar/ical/en.usa%23holiday%40group.v.calendar.google.com/public/basic.ics';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const TIMEZONE = process.env.TIMEZONE || 'America/New_York';

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
  const now = DateTime.now().setZone(TIMEZONE);
  let upcomingHoliday = null;

  for (const event of Object.values(events)) {
    if (event.type === 'VEVENT') {
      const eventStartUTC = DateTime.fromISO(event.start.toISOString(), { zone: 'utc' });
      const eventStart = eventStartUTC.setZone(TIMEZONE);
      
      if (eventStart > now) {
        if (!upcomingHoliday || eventStart < DateTime.fromISO(upcomingHoliday.start.toISOString(), { zone: 'utc' }).setZone(TIMEZONE)) {
          upcomingHoliday = { ...event, start: eventStart.toJSDate() };
        }
      }
    }
  }

  return upcomingHoliday;
}

async function sendDiscordNotification(holiday) {
  const message = {
    content: `🎉 Upcoming Holiday: **${holiday.summary}** on <t:${Math.floor(DateTime.fromJSDate(holiday.start).setZone(TIMEZONE).toSeconds())}:D>`,
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
  const now = DateTime.now().setZone(TIMEZONE);
  const holidays = await fetchHolidays();
  const upcomingHoliday = getUpcomingHoliday(holidays);

  if (upcomingHoliday && upcomingHoliday.uid !== lastNotifiedHoliday) {
    const daysUntilHoliday = Math.ceil((DateTime.fromJSDate(upcomingHoliday.start).setZone(TIMEZONE).diff(now, 'days').days));

    if (daysUntilHoliday <= 7) {
      await sendDiscordNotification(upcomingHoliday);
    }
  }
}

cron.schedule('0 9 * * *', () => {
  checkAndNotify();
}, {
  timezone: TIMEZONE
});

console.log('Holiday Discord Notifier is running. Press Ctrl+C to exit.');

// Initial check on startup
checkAndNotify();