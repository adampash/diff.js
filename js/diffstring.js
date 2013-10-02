/*
 * Javascript Diff Algorithm
 *  By John Resig (http://ejohn.org/)
 *  Modified by Chu Alan "sprite"
 *
 * Released under the MIT license.
 *
 * More Info:
 *  http://ejohn.org/projects/javascript-diff-algorithm/
 *  http://www.scribd.com/doc/1461552/A-technique-for-isolating-differences-between-files
 */

function escape(s) {
    var n = s;
    n = n.replace(/&/g, "&amp;");
    n = n.replace(/</g, "&lt;");
    n = n.replace(/>/g, "&gt;");
    n = n.replace(/"/g, "&quot;");

    return n;
}

function diffString( o, n ) {
  o = o.replace(/\s+$/, '');
  n = n.replace(/\s+$/, '');
  var link_re = /\s(?=[^\[]*\])/g;
  o = o.replace(link_re, '$spacebar$')
  n = n.replace(link_re, '$spacebar$')
  console.log(o);
  console.log(n);

  var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );
  var str = "";

  var oSpace = o.match(/\s+/g);
  if (oSpace == null) {
    oSpace = ["\n"];
  } else {
    oSpace.push("\n");
  }
  var nSpace = n.match(/\s+/g);
  if (nSpace == null) {
    nSpace = ["\n"];
  } else {
    nSpace.push("\n");
  }

  if (out.n.length == 0) {
      for (var i = 0; i < out.o.length; i++) {

        str += '$del$' + escape(out.o[i]) + "$/del$" + oSpace[i];
      }
  } else {
    for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
      str += '$del$' + escape(out.o[n]) + oSpace[n] + "$/del$";
    }

    for ( var i = 0; i < out.n.length; i++ ) {
      if (out.n[i].text == null) {

        str += '$ins$' + escape(out.n[i]) + "$/ins$" + nSpace[i];
      } else {
        var pre = "";

        for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++ ) {

          pre += '$del$' + escape(out.o[n]) + "$/del$" + oSpace[n];
        }
        str += " " + out.n[i].text + nSpace[i] + pre;
      }
    }
  }

  // str = merge_adjacent(str, ['del', 'ins'])
  // str = str.replace(/&ltt;/g, "wtf").replace(/&gtt;/g, "wtfrighte");
  console.log(str);
  return str;
}

function is_html(str) {
  return str.match(/\<.*\>/) != null;
}

function randomColor() {
    return "rgb(" + (Math.random() * 100) + "%, " +
                    (Math.random() * 100) + "%, " +
                    (Math.random() * 100) + "%)";
}
function diffString2( o, n ) {
  o = o.replace(/\s+$/, '');
  n = n.replace(/\s+$/, '');

  var out = diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );

  var oSpace = o.match(/\s+/g);
  if (oSpace == null) {
    oSpace = ["\n"];
  } else {
    oSpace.push("\n");
  }
  var nSpace = n.match(/\s+/g);
  if (nSpace == null) {
    nSpace = ["\n"];
  } else {
    nSpace.push("\n");
  }

  var os = "";
  var colors = new Array();
  for (var i = 0; i < out.o.length; i++) {
      colors[i] = randomColor();

      if (out.o[i].text != null) {
          os += '<span style="background-color: ' +colors[i]+ '">' +
                escape(out.o[i].text) + oSpace[i] + "</span>";
      } else {
          os += "<del>" + escape(out.o[i]) + oSpace[i] + "</del>";
      }
  }

  var ns = "";
  for (var i = 0; i < out.n.length; i++) {
      if (out.n[i].text != null) {
          ns += '<span style="background-color: ' +colors[out.n[i].row]+ '">' +
                escape(out.n[i].text) + nSpace[i] + "</span>";
      } else {
          ns += "<ins>" + escape(out.n[i]) + nSpace[i] + "</ins>";
      }
  }

  return { o : os , n : ns };
}

function buildWordIndex(words) {
  var wordsIndex = new Object();
  for ( var i = 0; i < words.length; i++ ) {
    if ( wordsIndex[ words[i] ] == null )
      wordsIndex[ words[i] ] = { rows: new Array(), o: null };
    wordsIndex[ words[i] ].rows.push( i );
  }
  return wordsIndex;
}

function diff( o, n ) {
  var ns = buildWordIndex(n);
  var os = buildWordIndex(o);

  // for each word in the new text
  for ( var i in ns ) {
    // why do we need this undefined check?
    if ( ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1 ) {
      n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
      o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
    }
  }
  // when a word matches at the some location in both strings, make a new object with it that has the index of it in the other string + the text

  for ( var i = 0; i < n.length - 1; i++ ) {
    if (
      // if this word is not in this position in the original string
      n[i].text != null
      // and the next word is unmatched
      && n[i+1].text == null
      // and we haven't passed the end of the original string
      && n[i].row + 1 < o.length
      // and at the next word in the original string is not matched
      && o[ n[i].row + 1 ].text == null
      // and the next word is the same in the origial string
      && n[i+1] == o[ n[i].row + 1 ]
      ) {
      n[i+1] = { text: n[i+1], row: n[i].row + 1 };
      o[n[i].row+1] = { text: o[n[i].row+1], row: i + 1 };
    }
  }

  for ( var i = n.length - 1; i > 0; i-- ) {
    if ( n[i].text != null && n[i-1].text == null && n[i].row > 0 && o[ n[i].row - 1 ].text == null &&
         n[i-1] == o[ n[i].row - 1 ] ) {
      n[i-1] = { text: n[i-1], row: n[i].row - 1 };
      o[n[i].row-1] = { text: o[n[i].row-1], row: i - 1 };
    }
  }

  return { o: o, n: n };
}
