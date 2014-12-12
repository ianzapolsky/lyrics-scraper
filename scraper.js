var request = require('request');
var cheerio = require('cheerio');
var _ = require('underscore');

/**
 * Override default underscore escape map
 */
var escapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  "'": '&apos;',
  '`': '&#x60;'
};
var unescapeMap = _.invert(escapeMap);
var createEscaper = function(map) {
  var escaper = function(match) {
    return map[match];
  };

  var source = '(?:' + _.keys(map).join('|') + ')';
  var testRegexp = RegExp(source);
  var replaceRegexp = RegExp(source, 'g');
  return function(string) {
    string = string == null ? '' : '' + string;
    return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
  };
};
_.escape = createEscaper(escapeMap);
_.unescape = createEscaper(unescapeMap);


/**
 * Main functionality
 */
if (process.argv.length != 3) {
  console.log('usage: node scraper.js <artist_name>');
  process.exit(1);
}

var artist = process.argv[2];
var url    = 'http://lyrics.wikia.com/api.php?artist=' + artist;
var urls   = [];
var lyrics = [];

var cleanLyrics = function(lyrics) {
  // replace html codes with punctuation
  lyrics = _.unescape(lyrics);
  // remove everything between brackets
  lyrics = lyrics.replace(/\[[^\]]*\]/g, '');
  // remove html comments
  lyrics = lyrics.replace(/(<!--)[^-]*-->/g, '');
  // remove all tags
  lyrics = lyrics.replace(/<[^>]*>/g, ' ');
  // remove all punctuation
  lyrics = lyrics.replace(/[\.\,]/g, '');
  // return all lower case
  return lyrics.toLowerCase();
};
    
// get the lyrics for an individual song 
var getLyrics = function(url, callback) {
  request(url, function(error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      $('script').remove()
      var cleanlyrics = cleanLyrics($('.lyricbox').html());
      callback(cleanlyrics);
    }
  });
};

// get a list of songs
request(url, function(error, response, html) {
  if (!error) {
    var $ = cheerio.load(html);
    var songs = $('.songs').find('li');
    for (var i = 0; i < songs.length; i++) {
      urls.push($(songs[i]).find('a').attr('href'));
    }
    urls.forEach(function(url) {
      getLyrics(url, function(songLyrics) {
        console.log(songLyrics);
      });
    });
  }
});

  
