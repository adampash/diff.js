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

  var differ = {
    parse: function(oldString, newString) {
      oldString = this.prepare_text(oldString);
      newString = this.prepare_text(newString);

      // split each string into an array of individual words
      var old_words = oldString == "" ? [] : oldString.split(/\s+/)
      var new_words = newString == "" ? [] : newString.split(/\s+/)

      // pass arrays of new and old words to diff method
      // diff method returns output of the diff
      var diff_output = this.diff(old_words, new_words);

      var str = "";

      // find all of the spaces in the previous string
      // so we can reassemble the words as they were
      // (doesn't seem all the necessary for HTML)
      var old_spaces = spaces(oldString);
      var new_spaces = spaces(newString);

      // if the newString was empty,
      // strike out everything from the oldString
      if (diff_output.new_words.length == 0) {
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

    diff: function(old_words, new_words) {
      var old_hash = this.build_word_index(old_words);
      var new_hash = this.build_word_index(new_words);

      // for each word in the new text
      // when the word appears in only once in both hashes
      // add a new object to the new_words and old_words
      // arrays that contains the index of that word in the other array
      // along with the text of the word
      for ( var i in new_hash ) {
        if (
          // word only occurs once in new_hash
          new_hash[i].rows.length == 1
          // and this key points to an object in the old_hash
          && typeof(old_hash[i]) != "undefined"
          // and the word also only occurs once in the old_hash
          && old_hash[i].rows.length == 1
        ) {
          // assume these words are unchanged matches;
          // make the new_words and old_words arrays
          // point at each other
          new_words[ new_hash[i].rows[0] ] = { text: new_words[ new_hash[i].rows[0] ], row: old_hash[i].rows[0] };
          old_words[ old_hash[i].rows[0] ] = { text: old_words[ old_hash[i].rows[0] ], row: new_hash[i].rows[0] };
        }
      }

      // try to find consecutive matching words.
      // this step is essentially trying to find
      // the best string of matches when a word
      // has been used more than once
      for ( var i = 0; i < new_words.length - 1; i++ ) {
        if (
          // if this word exists in the old_words
          new_words[i].text != null
          // and the next word is so-far unmatched
          && new_words[i + 1].text == null
          // and we haven't passed the end of the old_words
          && new_words[i].row + 1 < old_words.length
          // and the next word in the old_words is not yet matched
          && old_words[ new_words[i].row + 1 ].text == null
          // and the next word is the same in the old_words
          && new_words[i + 1] == old_words[ new_words[i].row + 1 ]
          )
        {
          // assume these next words are unchanged matches;
          // make the new_words and old_words arrays
          // point at each other
          new_words[i + 1] = { text: new_words[i + 1], row: new_words[i].row + 1 };
          old_words[new_words[i].row + 1] = { text: old_words[new_words[i].row + 1], row: i + 1 };
        }
      }

      // starting at the end of the new_words,
      // work backwards to find new matched reverse-consecutive
      // words
      for ( var i = new_words.length - 1; i > 0; i-- ) {
        if (
          // this word has been matched in the old_words
          new_words[i].text != null
          // and the previous word has not yet been matched
          && new_words[i - 1].text == null
          // and the current matched word isn't matched with
          // the first word of the old_words (remember that
          // this is working backwards, so we don't want a
          // negative index)
          && new_words[i].row > 0
          // and the previous word in old_words hasn't been matched
          && old_words[ new_words[i].row - 1 ].text == null
          // and the previous word matches in both new_words and old_words
          && new_words[i - 1] == old_words[ new_words[i].row - 1 ]
          )
        {
          // assume these next words are unchanged matches;
          // make the new_words and old_words arrays
          // point at each other
          new_words[i-1] = { text: new_words[i-1], row: new_words[i].row - 1 };
          old_words[new_words[i].row-1] = { text: old_words[new_words[i].row-1], row: i - 1 };
        }
      }

      return { old_words: old_words, new_words: new_words };

    },

    build_word_index: function(words_array) {
      var words_index = {};
      for ( var i = 0; i < words_array.length; i++ ) {
        if ( words_index[ words_array[i] ] == null )
          words_index[ words_array[i] ] = { rows: [], o: null };
        words_index[ words_array[i] ].rows.push( i );
      }
      return words_index;
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
      return string.replace(link_re, '$spacebar$');
    }
  }


  exports.differ = differ

}(typeof exports === 'undefined' ? this : exports));
