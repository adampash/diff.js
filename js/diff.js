;(function (exports) {

  var spaces = function(str) {
    var spaces = str.match(/\s+/g);
    if (spaces == null) {
      spaces = [];
    }
    return spaces.concat("\n");
  };

  var markup = {
    deleted: function(str) {
      return '$del$' + escape(str) + "$/del$";
    },

    inserted: function(str) {
      return '$ins$' + escape(str) + "$/ins$";
    }
  };

  var retrieve = function(obj, keys) {
    return keys.reduce(function(a, x) {
      return a && a[x];
    }, obj);
  };

  var build_word_index = function(words_array) {
    return words_array.reduce(function(a, x, i) {
      a[x] = a[x] || { rows: [], o: null };
      a[x].rows.push(i);
      return a;
    }, {});
  };

  var word = {
    frequency: function(wordHash, word) {
      return retrieve(wordHash, [word, "rows", "length"])
    },

    connect: function(words, row, connectedRow) {
      words[row] = { text: words[row], row: connectedRow };
    },

    exists: function(words, index) {
      return words[index].text !== null;
    }
  };

  var connectUnchangedWords = function(diff) {
    var old_hash = build_word_index(diff.old_words);
    var new_hash = build_word_index(diff.new_words);

    // for each word in the new text
    // when the word appears in only once in both hashes
    // add a new object to the diff.new_words and diff.old_words
    // arrays that contains the index of that word in the other array
    // along with the text of the word
    for ( var i in new_hash ) {
      if (word.frequency(new_hash, i) === 1 && word.frequency(old_hash, i) === 1) {
        // assume these words are unchanged matches
        word.connect(diff.new_words, new_hash[i].rows[0], old_hash[i].rows[0]);
        word.connect(diff.old_words, old_hash[i].rows[0], new_hash[i].rows[0]);
      }
    }
  };

  var chainMatchingWords = function(diff) {
    // try to find consecutive matching words.
    // this step is essentially trying to find
    // the best string of matches when a word
    // has been used more than once
    for ( var i = 0; i < diff.new_words.length - 1; i++ ) {
      if (
        word.exists(diff.new_words, i)
        && !word.exists(diff.new_words, i + 1) // and the next word is so-far unmatched
        // and we haven't passed the end of the diff.old_words
        && diff.new_words[i].row + 1 < diff.old_words.length
        && !word.exists(old_words, diff.new_words[i].row + 1)
        // and the next word is the same in the diff.old_words
        && diff.new_words[i + 1] == diff.old_words[ diff.new_words[i].row + 1 ]
      )
      {
        // chain current word to next in diff.new_words and diff.old_words
        word.connect(diff.new_words, i + 1, diff.new_words[i].row + 1);
        word.connect(diff.old_words, diff.new_words[i].row + 1, i + 1);
      }
    }
  };

  var diff =  function(old_words, new_words) {
    var diff = {
      old_words: old_words,
      new_words: new_words
    };

    connectUnchangedWords(diff);
    chainMatchingWords(diff);
    diff.old_words.reverse();
    diff.new_words.reverse();
    chainMatchingWords(diff);
    diff.old_words.reverse();
    diff.new_words.reverse();
    return diff;
  };

  var differ = {
    stringToWords: function(str) {
      str = this.prepare_text(str);
      return str == "" ? [] : str.split(/\s+/);
    },

    parse: function(oldString, newString) {
      // pass arrays of new and old words to diff method
      // diff method returns output of the diff
      var diff_output = diff(this.stringToWords(oldString), this.stringToWords(newString));

      var str = "";

      // find all of the spaces in the previous string
      // so we can reassemble the words as they were
      // (doesn't seem all the necessary for HTML)
      var old_spaces = spaces(oldString);
      var new_spaces = spaces(newString);

      // if the newString was empty,
      // strike out everything from the oldString
      if (diff_output.new_words.length == 0) { // why is there a special case for length 0?
        for (var i = 0; i < diff_output.old_words.length; i++) {
          str += markup.deleted(escape(diff_output.old_words[i])) + old_spaces[i];
        }
      }
      // assemble the diffed string by stitching together
        // the oldString and the newString.
      else {
        // for all old_words that were deleted
        // (indicated by a lack of an object at this index)
        // this loop stops as soon as an old word matches with
        // the new string (essentially just creating the deleted strings
        // at the beginning of the diff)
        for (n = 0;
             n < diff_output.old_words.length
             && diff_output.old_words[n].text == null;
             n++)
        {
          // surround those words w/delete indicators/tags and
          // add back its spaces
          str += markup.deleted(escape(diff_output.old_words[n]) + old_spaces[n]);
        }

        // for all words in the newString
        for ( var i = 0; i < diff_output.new_words.length; i++ ) {
          // if the word did not match any in the oldString
          if (diff_output.new_words[i].text == null) {
            // surround the word w/insert indicators/tags
            // and add back its spaces
            str += markup.inserted(escape(diff_output.new_words[i])) + new_spaces[i];
          }
          // if the word did match with the oldString
          else {
            var pre = "";

            for (
                  n = diff_output.new_words[i].row + 1;
                  n < diff_output.old_words.length
                  && diff_output.old_words[n].text == null;
                  n++
                )
            {

              pre += markup.deleted(escape(diff_output.old_words[n])) + old_spaces[n];
            }
            str += " " + diff_output.new_words[i].text + new_spaces[i] + pre;
          }
        }
      }

      return str;
    },

    prepare_text: function(string) {
      string = this.remove_extra_spaces(string);
      string = this.prepare_markdown(string);
      return string;
    },

    remove_extra_spaces: function(string) {
      // replace extra end-of-line spaces
      return string.replace(/\s+$/, '');
    },

    prepare_markdown: function(string) {
      // we don't want to split up markup-style links
      // so we're replacing spaces
      var link_re = /\s(?=[^\[]*\])/g;
      return string.replace(link_re, '$spacebar$'); // should you put spaces back after diff?
    }
  }




  exports.differ = differ

}(typeof exports === 'undefined' ? this : exports));
