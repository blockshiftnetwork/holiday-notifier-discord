# Holiday Discord Notifier

Holiday Discord Notifier is a Node.js application that sends notifications to a Discord channel about upcoming holidays using the official holiday calendar from US.

## Prerequisites

- Node.js installed on your system.
- A Discord webhook URL.

## Setup

1. Clone the repository to your local machine.

2. Install the dependencies:

```sh
npm install
```

3. Set the `DISCORD_WEBHOOK_URL` environment variable with your Discord webhook URL.

On Unix-based systems, you can set it like this:

```sh
export DISCORD_WEBHOOK_URL='your_webhook_url_here'
```

On Windows, use:

```cmd
set DISCORD_WEBHOOK_URL=your_webhook_url_here
```

## Usage

Run the notifier:

```sh
node index.js
```

The notifier checks for upcoming holidays daily at 9:00 AM and sends a notification to your Discord channel if a holiday is within the upcoming week.

## How It Works

- The application uses `node-cron` to schedule a daily task at 9:00 AM.
- It fetches holiday information from a public Google Calendar .ics feed.
- It checks for upcoming holidays within the next 7 days.
- If an upcoming holiday is found and hasn’t been notified yet, it sends a formatted notification to the specified Discord webhook.

## Dependencies

- `axios`: To perform HTTP requests.
- `ical`: To parse the .ics calendar data.
- `node-cron`: To schedule periodic checks.

## Note

Ensure that the Discord webhook URL is set correctly to receive notifications. If not set, the application will terminate with an error message.
