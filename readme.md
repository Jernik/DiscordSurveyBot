# DiscordImageScreening

a simple bot to allow moderators to approve images posted to a channel

to run it add a .env file to the root of the repo with the following format:

DISCORD_TOKEN=<token>
CLIENT_ID=<client_id>
APPROVAL_CHANNEL_ID=<the channel your moderators review images in>
SCANNING_CHANNELS=[{"submission_channel_id":"975471862781980743", "approved_images_channel_id":"975471917257617498"}]
MODERATOR_ROLE_IDS=["475331845605687306"]
