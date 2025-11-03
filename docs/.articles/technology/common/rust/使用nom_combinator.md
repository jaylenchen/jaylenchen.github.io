# 使用nom::combinator

## [recognize](https://docs.rs/nom/7.1.3/nom/combinator/fn.recognize.html)

If the child parser was successful, return the consumed input as produced value.

```rust
use nom::combinator::recognize;
use nom::character::complete::{char, alpha1};
use nom::sequence::separated_pair;

let mut parser = recognize(separated_pair(alpha1, char(','), alpha1));

assert_eq!(parser("abcd,efgh"), Ok(("", "abcd,efgh")));
assert_eq!(parser("abcd;"),Err(Err::Error((";", ErrorKind::Char))));
```

recognize的作用是：如果子解析器匹配上了用户给的指定规则，那么整个匹配过程中的被匹配项都会被收集起来，成为recognize的输出结果。比如这里的"abcd,efgh"，被separated_pair(alpha1, char(','), alpha1)匹配上了，结果就是"abcd,efgh"会被收集，作为recognize的输出结果。

注意：这里我们压根就不管子解析器separated_pair(alpha1, char(','), alpha1)的解析结果，我们只关心整个"abcd,efgh"是否匹配命中separated_pair(alpha1, char(','), alpha1)所代表的规则。

## [opt](https://docs.rs/nom/7.1.3/nom/combinator/fn.opt.html)

Optional parser, will return `None` on `Err::Error`.

```rust
use nom::combinator::opt;
use nom::character::complete::alpha1;

fn parser(i: &str) -> IResult<&str, Option<&str>> {
  opt(alpha1)(i)
}

assert_eq!(parser("abcd;"), Ok((";", Some("abcd"))));
assert_eq!(parser("123;"), Ok(("123;", None)));
```

opt的作用是：如果解析器匹配上了相关规则，那么返回匹配上的内容，如果没有匹配上则返回None，并不会报错，一定会返回Option值，可以用来匹配可有可无的内容。比如说一个token后边可能跟着一个逗号，也可能没有逗号，接着继续匹配下一个内容。那么这样的情况下，使用opt(逗号)，就说明”token 逗号 token”，“token token”都可以被匹配上。

## [peek](https://docs.rs/nom/7.1.3/nom/combinator/fn.peek.html)

Tries to apply its parser without consuming the input.

```rust
use nom::combinator::peek;
use nom::character::complete::alpha1;

let mut parser = peek(alpha1);

assert_eq!(parser("abcd;"), Ok(("abcd;", "abcd")));
assert_eq!(parser("123;"), Err(Err::Error(("123;", ErrorKind::Alpha))));
```

peek的作用就是在不吃掉token的前提下，去看下被peek包裹住的解析器是否能够匹配到内容，能的话捕捉出来。peek可以用在你想要捕捉匹配一些内容，但是又不愿意在匹配的过程当中吃掉被匹配的内容的场景下。

## [not](https://docs.rs/nom/7.1.3/nom/combinator/fn.not.html)

Succeeds if the child parser returns an error.

```rust
use nom::combinator::not;
use nom::character::complete::alpha1;

let mut parser = not(alpha1);

assert_eq!(parser("123"), Ok(("123", ())));
assert_eq!(parser("abcd"), Err(Err::Error(("abcd", ErrorKind::Not))));
```

not的作用是不要not包裹住的子解析器匹配的内容。

## [verify](https://docs.rs/nom/7.1.3/nom/combinator/fn.verify.html)

Returns the result of the child parser if it satisfies a verification function.

```rust
use nom::combinator::verify;
use nom::character::complete::alpha1;

let mut parser = verify(alpha1, |s: &str| s.len() == 4);

assert_eq!(parser("abcd"), Ok(("", "abcd")));
assert_eq!(parser("abcde"), Err(Err::Error(("abcde", ErrorKind::Verify))));
assert_eq!(parser("123abcd;"),Err(Err::Error(("123abcd;", ErrorKind::Alpha))));
```

verify的作用是当子解析器匹配上之后，还不能直接成功返回使用，需要再调用后边第二个参数的闭包对当前子解析器匹配的结果做一次检验，当校验条件通过之后才返回具体的内容。闭包的参数就是子解析器匹配到的内容。

## [value](https://docs.rs/nom/7.1.3/nom/combinator/fn.value.html)

Returns the provided value if the child parser succeeds.

```rust
use nom::combinator::value;
use nom::character::complete::alpha1;

let mut parser = value(1234, alpha1);

assert_eq!(parser("abcd"), Ok(("", 1234)));
assert_eq!(parser("123abcd;"), Err(Err::Error(("123abcd;", ErrorKind::Alpha))));
```

value的意思是指定一个值，当子解析器匹配上内容成功之后，将指定的值作为value的结果返回。

## [map_res](https://docs.rs/nom/7.1.3/nom/combinator/fn.map_res.html)

Applies a function returning a `Result` over the result of a parser.

```rust
use nom::character::complete::digit1;
use nom::combinator::map_res;

let mut parse = map_res(digit1, |s: &str| s.parse::<u8>());

// the parser will convert the result of digit1 to a number
assert_eq!(parse("123"), Ok(("", 123)));

// this will fail if digit1 fails
assert_eq!(parse("abc"), Err(Err::Error(("abc", ErrorKind::Digit))));

// this will fail if the mapped function fails (a `u8` is too small to hold `123456`)
assert_eq!(parse("123456"), Err(Err::Error(("123456", ErrorKind::MapRes))));
```

map_res的作用是调用map_res包裹住的子解析器匹配内容，匹配成功之后，调用闭包进行匹配内容转换，闭包的参数就是子解析器匹配上的内容。

## [map_parser](https://docs.rs/nom/7.1.3/nom/combinator/fn.map_parser.html)

Applies a parser over the result of another one.

```rust
use nom::character::complete::digit1;
use nom::bytes::complete::take;
use nom::combinator::map_parser;

let mut parse = map_parser(take(5u8), digit1);

assert_eq!(parse("12345"), Ok(("", "12345")));
assert_eq!(parse("123ab"), Ok(("", "123")));
assert_eq!(parse("123"), Err(Err::Error(("123", ErrorKind::Eof))));
```

map_parser的作用是调用map_parser包裹住的第一个子解析器进行内容匹配，当第一个子解析器匹配上内容后，再交给第二个子解析器进行匹配。有点内容匹配过滤的意思.

## [map_opt](https://docs.rs/nom/7.1.3/nom/combinator/fn.map_opt.html)

Applies a function returning an `Option` over the result of a parser.

```rust
use nom::character::complete::digit1;
use nom::combinator::map_opt;

let mut parse = map_opt(digit1, |s: &str| s.parse::<u8>().ok());

// the parser will convert the result of digit1 to a number
assert_eq!(parse("123"), Ok(("", 123)));

// this will fail if digit1 fails
assert_eq!(parse("abc"), Err(Err::Error(("abc", ErrorKind::Digit))));

// this will fail if the mapped function fails (a `u8` is too small to hold `123456`)
assert_eq!(parse("123456"), Err(Err::Error(("123456", ErrorKind::MapOpt))));
```

map_opt的作用是调用第一个子解析器去匹配内容，然后调用第二个闭包对第一个子解析器解析到的内容进行一个转换，只不过返回的是一个Option值。实际匹配过程跟map_res很像。

## [cond](https://docs.rs/nom/7.1.3/nom/combinator/fn.cond.html)

Calls the parser if the condition is met.

```rust
use nom::combinator::cond;
use nom::character::complete::alpha1;

fn parser(b: bool, i: &str) -> IResult<&str, Option<&str>> {
  cond(b, alpha1)(i)
}

assert_eq!(parser(true, "abcd;"), Ok((";", Some("abcd"))));
assert_eq!(parser(false, "abcd;"), Ok(("abcd;", None)));
assert_eq!(parser(true, "123;"), Err(Err::Error(Error::new("123;", ErrorKind::Alpha))));
assert_eq!(parser(false, "123;"), Ok(("123;", None)));
```

cond的作用是根据第一个条件是否成立，决定是否调用子解析器。简而言之，根据true/false调用子解析器。

## [complete](https://docs.rs/nom/7.1.3/nom/combinator/fn.complete.html)

Transforms Incomplete into `Error`.

```rust
use nom::bytes::streaming::take;
use nom::combinator::complete;

let mut parser = complete(take(5u8));

assert_eq!(parser("abcdefg"), Ok(("fg", "abcde")));
assert_eq!(parser("abcd"), Err(Err::Error(("abcd", ErrorKind::Complete))));
```

complete的作用是当子解析器完全匹配上的时候才把匹配上的内容作为complete的匹配结果输出，否则报错。
