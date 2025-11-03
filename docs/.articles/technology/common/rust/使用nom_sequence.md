# 使用nom::sequence

## [delimited](https://docs.rs/nom/7.1.3/nom/sequence/fn.delimited.html)

Matches an object from the first parser and discards it, then gets an object from the second parser, and finally.

```rust
use nom::sequence::delimited;
use nom::bytes::complete::tag;

let mut parser = delimited(tag("("), tag("abc"), tag(")"));

assert_eq!(parser("(abc)"), Ok(("", "abc")));
assert_eq!(parser("(abc)def"), Ok(("def", "abc")));
assert_eq!(parser(""), Err(Err::Error(("", ErrorKind::Tag))));
assert_eq!(parser("123"), Err(Err::Error(("123", ErrorKind::Tag))));
```

delimited的作用是从前往后使用子解析器去匹配内容，当整体匹配成功之后，只取中间的子解析器匹配的内容作为delimited的输出结果。

## [pair](https://docs.rs/nom/7.1.3/nom/sequence/fn.pair.html)

Gets an object from the first parser, then gets another object from the second parser.

```rust
use nom::sequence::pair;
use nom::bytes::complete::tag;

let mut parser = pair(tag("abc"), tag("efg"));

assert_eq!(parser("abcefg"), Ok(("", ("abc", "efg"))));
assert_eq!(parser("abcefghij"), Ok(("hij", ("abc", "efg"))));
assert_eq!(parser(""), Err(Err::Error(("", ErrorKind::Tag))));
assert_eq!(parser("123"), Err(Err::Error(("123", ErrorKind::Tag))));
```

pair的作用就是逐一匹配两个子解析器，当两个解析器都匹配成功之后，将匹配的结果用一个元组收集起来，作为pair的输出结果。

## [preceded](https://docs.rs/nom/7.1.3/nom/sequence/fn.preceded.html)

Matches an object from the first parser and discards it, then gets an object from the second parser.

```rust
use nom::sequence::preceded;
use nom::bytes::complete::tag;

let mut parser = preceded(tag("abc"), tag("efg"));

assert_eq!(parser("abcefg"), Ok(("", "efg")));
assert_eq!(parser("abcefghij"), Ok(("hij", "efg")));
assert_eq!(parser(""), Err(Err::Error(("", ErrorKind::Tag))));
assert_eq!(parser("123"), Err(Err::Error(("123", ErrorKind::Tag))));
```

preceded的作用就是逐一使用两个子解析器匹配内容，当两个解析器都匹配内容成功之后，取最后一个解析器的匹配内容作为preceded的输出结果。

## [separated_pair](https://docs.rs/nom/7.1.3/nom/sequence/fn.separated_pair.html)

Gets an object from the first parser, then matches an object from the sep_parser and discards it, then gets another object from the second parser.

```rust
use nom::sequence::separated_pair;
use nom::bytes::complete::tag;

let mut parser = separated_pair(tag("abc"), tag("|"), tag("efg"));

assert_eq!(parser("abc|efg"), Ok(("", ("abc", "efg"))));
assert_eq!(parser("abc|efghij"), Ok(("hij", ("abc", "efg"))));
assert_eq!(parser(""), Err(Err::Error(("", ErrorKind::Tag))));
assert_eq!(parser("123"), Err(Err::Error(("123", ErrorKind::Tag))));
```

separated_pair的作用是从左往右逐一使用三个子解析器匹配内容，如果全部都匹配上了，就前后两个子解析器的内容收集到一个元组当中作为separated_pair的输出结果，否则报错。

## [terminated](https://docs.rs/nom/7.1.3/nom/sequence/fn.terminated.html)

Gets an object from the first parser, then matches an object from the second parser and discards it.

```rust
use nom::sequence::terminated;
use nom::bytes::complete::tag;

let mut parser = terminated(tag("abc"), tag("efg"));

assert_eq!(parser("abcefg"), Ok(("", "abc")));
assert_eq!(parser("abcefghij"), Ok(("hij", "abc")));
assert_eq!(parser(""), Err(Err::Error(("", ErrorKind::Tag))));
assert_eq!(parser("123"), Err(Err::Error(("123", ErrorKind::Tag))));
```

terminated作用是从左往右逐一使用两个子解析器进行内容匹配，如果全部匹配上了，取第一个子解析器的内容作为terminated的输出结果。使用场景：匹配以xxx为结尾的情况。

## [tuple](https://docs.rs/nom/7.1.3/nom/sequence/fn.tuple.html)

Applies a tuple of parsers one by one and returns their results as a tuple. There is a maximum of 21 parsers

```rust
use nom::sequence::tuple;
use nom::character::complete::{alpha1, digit1};
let mut parser = tuple((alpha1, digit1, alpha1));

assert_eq!(parser("abc123def"), Ok(("", ("abc", "123", "def"))));
assert_eq!(parser("123def"), Err(Err::Error(("123def", ErrorKind::Alpha))));
```

tuple的作用是给定一个放着子解析器的元组，从左往右逐一匹配子解析器，当所有子解析器都匹配成功之后，将各子解析器匹配到的内容收集到一个元组当中作为tuple的输出结果。
