hubot-secret-ballot
==============

Create polls and vote on them by private messaging hubot.

API
---

* `poll create "<question>"` - (pm only) create new poll in progress, ex. `poll create "which one?"`
* `poll add option "<option>"` - (pm only) add an option to a poll currently in progress, ex. `poll add option "some option"`
* `poll preview` - (pm only) preview a poll currently in progress
* `poll done` - (pm only) finish and activate a poll currently in progress
* `poll random` - (pm only) show details for a random poll
* `poll vote <poll number> <option letter>` - (pm only) vote on a poll, ex. `poll vote 1 a`
* `hubot poll list` - (public or pm) lists all existing polls
* `hubot poll show <poll number>` - (public or pm) show details for a single poll, ex. `hubot poll show 1`
* `hubot poll results <poll number>` - (public or pm) list results for a single poll (public or private), ex. `hubot poll results 1`

Uses hubot brain.

## Add it to your hubot

Run the following command 

    $ npm install hubot-secret-ballot --save

Then add `hubot-secret-ballot` to the `external-scripts.json` file (you may need to create this file).

    ["hubot-secret-ballot"]
