test("Replacing end of line spaces", function() {
  ok(Diff.remove_extra_spaces("Hi there  ") == "Hi there")
});

test("We don't want to split markdown links", function() {
  ok(Diff.prepare_markdown("This is a [link to somewhere](http://example.com)")
                        == "This is a [link$spacebar$to$spacebar$somewhere](http://example.com)")
});

test("Comparing diffstring method with Diff method", function(){
  ok(Diff.parse("one two three", "two three four") == diffString("one two three", "two three four"))
});

// test( "Diffing strings", function() {
//   ok( Diff.parse("foo bar baz foo", "foo baz foo bar") == "foo <del>bar</del> baz <del>foo</del>", "Diffing two simple strings" );
// });