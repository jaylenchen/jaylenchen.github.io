# 使用nom::branch

## [alt](https://docs.rs/nom/7.1.3/nom/branch/fn.alt.html)

Tests a list of parsers one by one until one succeeds.

```rust
use nom::character::complete::{alpha1, digit1};
use nom::branch::alt;
fn parser(input: &str) -> IResult<&str, &str> {
  alt((alpha1, digit1))(input)
};

// the first parser, alpha1, recognizes the input
assert_eq!(parser("abc"), Ok(("", "abc")));

// the first parser returns an error, so alt tries the second one
assert_eq!(parser("123456"), Ok(("", "123456")));

// both parsers failed, and with the default error type, alt will return the last error
assert_eq!(parser(" "), Err(Err::Error(error_position!(" ", ErrorKind::Digit))));
```

alt的作用是从前往后不断尝试每一个子解析器，如果有一个子解析器匹配成功了，那么匹配的内容就是alt的输出结果。
