// Description:
//   This description shows up in the /help command
//
// Commands:
//   poll create "<question>" - (pm only) create new poll in progress, ex. `poll create "which one?"`
//   poll add option "<option>" - (pm only) add an option to a poll currently in progress, ex. `poll add option "some option"`
//   poll preview - (pm only) preview a poll currently in progress
//   poll done - (pm only) finish and activate a poll currently in progress
//   poll random - (pm only) show details for a random poll
//   poll vote <poll number> <option letter> - (pm only) vote on a poll, ex. `poll vote 1 a`
//   hubot poll list - (public or pm) lists all existing polls
//   hubot poll show <poll number> - (public or pm) show details for a single poll, ex. `hubot poll show 1`
//   hubot poll results <poll number> - (public or pm) list results for a single poll (public or private), ex. `hubot poll results 1`

module.exports = function(robot) {
  var noPollInProgressMsg = 'You currently have no polls in progress. To create a new one, say `poll create "[question]"` (question in quotation marks).';

  var getUsername = function(msg) {
    return msg.message.user.name;
  };

  var isPrivateMsg = function(msg) {
    return msg.message.room === msg.message.user.name;
  };

  /**
   * find a poll by id
   *
   * @param {number} id
   * @return {object|undefined}
   */
  var find = function(id) {
    var polls = robot.brain.get('polls') || [];
    var poll = polls.filter(function(poll) {
      return poll.id === id;
    })[0];
    return poll;
  };

  /**
   * print out poll question, options, and instructions for voting
   *
   * @param {object} poll 
   * @param {object} msg - hubot msg object
   * @param {boolean} showScores - whether to show the score for each option
   */
  var printPoll = function(poll, msg, showScores) {
    msg.send(poll.id + '. ' + poll.question + ' (created by ' + poll.author + ')');
    msg.send('options:');
    var optionsStr = '';
    poll.options.forEach(function(option, idx) {
      var label = String.fromCharCode(idx + 97); // map option idx to alpha letters
      var optionStr = label + '. ' + option.name;
      if (showScores) {
        optionStr += ' (' + option.score + ')';
      }
      optionsStr += optionStr;
      optionsStr += '\n';
    });
    msg.send(optionsStr);
    msg.send('To vote on this poll, private message me `poll vote [poll number] [option letter]`, e.g., `poll vote 1 a`. To see results for this poll, say `poll results [poll number]`.');
  };

  robot.hear(/poll create "(.+)"/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var question = msg.match[1];
      var author = getUsername(msg);

      var polls = robot.brain.get('polls_in_progress') || {};
      var poll = polls[author];
      
      if (typeof poll === 'object') {
        msg.send('You already have a poll in progress. Say `poll add option "[option]"` (option in quotation marks) to add an option to your current in-progress poll. Say `poll done` to finish and activate the poll.');
      } else if (typeof poll === 'undefined') {
        var newPoll = {
          author: author,
          question: question
        };
        polls[author] = newPoll;
        robot.brain.set('polls_in_progress', polls);

        msg.send('Created poll ' + '"' + question + '". Say `poll add option "[option]"` (option in quotation marks) to add an option to your current in-progress poll. Say `poll done` to finish and activate the poll.');
      }
    }
  });

  robot.hear(/poll add option "(.+)"/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var newOptionName = msg.match[1];
      var author = getUsername(msg);

      var polls = robot.brain.get('polls_in_progress') || {};
      var poll = polls[author];

      if (typeof poll === 'object') {
        poll.options = poll.options || [];
        var newOption = { name: newOptionName, score: 0 };
        poll.options.push(newOption);
        robot.brain.set('polls_in_progress', polls);
        msg.send('You added option "' + newOptionName + '" to poll "' + poll.question + '". Add another option, or say `poll preview` or `poll done`.');
      } else if (typeof poll === 'undefined') {
        msg.send(noPollInProgressMsg);
      }
    }
  });
  
  robot.hear(/poll preview/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var author = getUsername(msg);
      var polls = robot.brain.get('polls_in_progress') || {};
      var poll = polls[author];

      if (typeof poll === 'object') {
        msg.send(poll.question + ' (created by ' + author + ')');
        msg.send('options:');
        var optionsStr = '';
        if (poll.options && poll.options.length > 0) {
          poll.options.forEach(function(option, idx) {
            var label = String.fromCharCode(idx + 97);
            var optionStr = label + '. ' + option.name;
            optionsStr += optionStr;
            optionsStr += '\n';
          });
          msg.send(optionsStr);
        } else {
          msg.send('No options yet.');
        }
      } else if (typeof poll === 'undefined') {
        msg.send(noPollInProgressMsg);
      }
    }
  });

  robot.hear(/poll done/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var author = getUsername(msg);
      var pollsInProgress = robot.brain.get('polls_in_progress') || {};
      var poll = pollsInProgress[author];

      if (typeof poll === 'object') {
        // increment max ID
        var maxID = robot.brain.get('polls_max_id') || 0;
        var id = maxID + 1;
        robot.brain.set('polls_max_id', id);

        // save poll
        var existingPolls = robot.brain.get('polls') || [];
        poll.id = id;
        existingPolls.push(poll);
        robot.brain.set('polls', existingPolls);
        msg.send('Poll "' + poll.question + '" saved.');

        // clear poll in progress
        delete pollsInProgress[author];
        robot.brain.set('polls_in_progress', pollsInProgress);
      } else if (typeof poll === 'undefined') {
        msg.send(noPollInProgressMsg);
      }
    }
  });

  robot.respond(/poll list/i, function(msg) {
    var polls = robot.brain.get('polls') || [];
    msg.send('Current polls:');
    if (polls.length === 0) {
      msg.send('No current polls.');
    } else {
      var pollsStr = '';
      polls.forEach(function(poll) {
        var pollStr = poll.id + '. ' + poll.question;
        pollsStr += pollStr;
        pollsStr += '\n';
      });
      msg.send(pollsStr);
      msg.send('To show options for a single poll, say `poll show [number]`.');
    }
  });

  robot.hear(/poll show (\d+)/i, function(msg) {
    var pollID = Number(msg.match[1]);
    var poll = find(pollID);

    if (typeof poll === 'undefined') {
      msg.send('Sorry, I couldn\'t find that poll.');
    } else {
      printPoll(poll, msg, false);
    }
  });

  robot.hear(/poll vote (\d+) ([A-Za-z])/i, function(msg) {
    if (isPrivateMsg(msg)) {
      // find poll by id number
      var pollID = Number(msg.match[1]);
      var polls = robot.brain.get('polls');
      var poll = polls.filter(function(poll) {
        return poll.id === pollID;
      })[0];

      if (typeof poll === 'undefined') {
        msg.send('Sorry, I couldn\'t find that poll.');
        return;
      }

      // check for duplicate votes
      var votes = robot.brain.get('poll_user_votes') || {};
      var votedPolls = votes[getUsername(msg)] || [];
      if (votedPolls.indexOf(pollID) !== -1) {
        msg.send('You\'ve already voted on this poll.');
        return;
      }

      // find option by letter
      var optionLabel = msg.match[2];
      var optionIdx = optionLabel.charCodeAt() - 97;

      if (typeof poll.options[optionIdx] === 'undefined') {
        msg.send('Sorry, I couldn\'t find that option for poll ' + pollID + '.');
        return;
      }
      
      // increment option score and save
      poll.options[optionIdx].score += 1;
      robot.brain.set('polls', polls);

      // add this poll to the list of polls this user has voted on
      votedPolls.push(pollID);
      votes[getUsername(msg)] = votedPolls;
      robot.brain.set('poll_user_votes', votes);

      msg.send('You voted for ' + poll.options[optionIdx].name + ' on poll "' + poll.question + '"');
    }
  });

  robot.respond(/poll results (\d+)/i, function(msg) {
    var pollID = Number(msg.match[1]);
    var poll = find(pollID);

    if (typeof poll === 'undefined') {
      msg.send('Sorry, I couldn\'t find that poll.');
    } else {
      msg.send('Results for:');
      printPoll(poll, msg, true);
    }
  });

  robot.hear(/poll random/i, function(msg) {
    if (isPrivateMsg(msg)) {
      var polls = robot.brain.get('polls');
      var pollIdx = Math.floor(Math.random() * polls.length);
      var poll = polls[pollIdx];

      printPoll(poll, msg, false);
    }
  });

  // "private" function for bot owner to reset data
  robot.hear(/poll flushall/, function(msg) {
    if (isPrivateMsg(msg)) {
      robot.brain.set('polls', []);
      robot.brain.set('polls_in_progress', []);
      robot.brain.set('polls_max_id', 0);
      msg.send('Poll data flushed.');
    }
  });
};
