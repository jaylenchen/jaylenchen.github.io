---
publish: true
date: 2023/09/05 22:00
title: 使用nom::multi
project: openwizard
tags:
 - parser-combinator
---

# 使用nom::multi

## [count](https://docs.rs/nom/7.1.3/nom/multi/fn.count.html)

Runs the embedded parser `count` times, gathering the results in a `Vec`.

```rust
use nom::multi::count;
use nom::bytes::complete::tag;

fn parser(s: &str) -> IResult<&str, Vec<&str>> {
  count(tag("abc"), 2)(s)
}

assert_eq!(parser("abcabc"), Ok(("", vec!["abc", "abc"])));
assert_eq!(parser("abc123"), Err(Err::Error(Error::new("123", ErrorKind::Tag))));
assert_eq!(parser("123123"), Err(Err::Error(Error::new("123123", ErrorKind::Tag))));
assert_eq!(parser(""), Err(Err::Error(Error::new("", ErrorKind::Tag))));
assert_eq!(parser("abcabcabc"), Ok(("abc", vec!["abc", "abc"])));
```

count的作用是将子解析器匹配n次，当n次都匹配成功之后，将每次匹配的内容收集到一个vec当中作为count的输出结果。

## [fill](https://docs.rs/nom/7.1.3/nom/multi/fn.fill.html)

Runs the embedded parser repeatedly, filling the given slice with results.

```rust
use nom::multi::fill;
use nom::bytes::complete::tag;

fn parser(s: &str) -> IResult<&str, [&str; 2]> {
  let mut buf = ["", ""];
  let (rest, ()) = fill(tag("abc"), &mut buf)(s)?;
  Ok((rest, buf))
}

assert_eq!(parser("abcabc"), Ok(("", ["abc", "abc"])));
assert_eq!(parser("abc123"), Err(Err::Error(Error::new("123", ErrorKind::Tag))));
assert_eq!(parser("123123"), Err(Err::Error(Error::new("123123", ErrorKind::Tag))));
assert_eq!(parser(""), Err(Err::Error(Error::new("", ErrorKind::Tag))));
assert_eq!(parser("abcabcabc"), Ok(("abc", ["abc", "abc"])));
```

fill的作用是使用子解析器进行匹配，匹配成功后往第二个可写的数组中填入匹配成功的内容，匹配的次数由数组的长度决定。当且仅当匹配成功，同时填入的次数满足数组的长度两个条件同时成立时，将填入结果后的数组作为fill的输出结果。

## [fold_many0](https://docs.rs/nom/7.1.3/nom/multi/fn.fold_many0.html)

Repeats the embedded parser, calling `g` to gather the results.

```rust
use nom::multi::fold_many0;
use nom::bytes::complete::tag;

fn parser(s: &str) -> IResult<&str, Vec<&str>> {
  fold_many0(
    tag("abc"),
    Vec::new,
    |mut acc: Vec<_>, item| {
      acc.push(item);
      acc
    }
  )(s)
}

assert_eq!(parser("abcabc"), Ok(("", vec!["abc", "abc"])));
assert_eq!(parser("abc123"), Ok(("123", vec!["abc"])));
assert_eq!(parser("123123"), Ok(("123123", vec![])));
assert_eq!(parser(""), Ok(("", vec![])));
```

fold_many0作用是使用第一个解析器进行内容递归匹配，并准备一个vec，每一次匹配成功后然后再递归地在第三个闭包中处理每一次匹配到的内容，最后返回该vec作为fold_many0的处理结果。比如：这里的tag(”abc”)，会不断尝试匹配abc，匹配成功一次，处理一次，将结果收集到vec，然后传递下去，下一次接着处理完毕后往vec装入，最后返回作为fold_many0的输出结果。

## [fold_many1](https://docs.rs/nom/7.1.3/nom/multi/fn.fold_many1.html)

Repeats the embedded parser, calling `g` to gather the results.

```rust
use nom::multi::fold_many1;
use nom::bytes::complete::tag;

fn parser(s: &str) -> IResult<&str, Vec<&str>> {
  fold_many1(
    tag("abc"),
    Vec::new,
    |mut acc: Vec<_>, item| {
      acc.push(item);
      acc
    }
  )(s)
}

assert_eq!(parser("abcabc"), Ok(("", vec!["abc", "abc"])));
assert_eq!(parser("abc123"), Ok(("123", vec!["abc"])));
assert_eq!(parser("123123"), Err(Err::Error(Error::new("123123", ErrorKind::Many1))));
assert_eq!(parser(""), Err(Err::Error(Error::new("", ErrorKind::Many1))));
```

fold_many1的作用同fold_many0，只不过是必须匹配上一次，不然报错。比如这里的例子，对比发现fold_many1在匹配空字符串切片的时候，会报错，而fold_many0只是返回空vec。

## [fold_many_m_n](https://docs.rs/nom/7.1.3/nom/multi/fn.fold_many_m_n.html)

Repeats the embedded parser `m..=n` times, calling `g` to gather the results

```rust
use nom::multi::fold_many_m_n;
use nom::bytes::complete::tag;

fn parser(s: &str) -> IResult<&str, Vec<&str>> {
  fold_many_m_n(
    0,
    2,
    tag("abc"),
    Vec::new,
    |mut acc: Vec<_>, item| {
      acc.push(item);
      acc
    }
  )(s)
}

assert_eq!(parser("abcabc"), Ok(("", vec!["abc", "abc"])));
assert_eq!(parser("abc123"), Ok(("123", vec!["abc"])));
assert_eq!(parser("123123"), Ok(("123123", vec![])));
assert_eq!(parser(""), Ok(("", vec![])));
assert_eq!(parser("abcabcabc"), Ok(("abc", vec!["abc", "abc"])));
```

fold_many_m_n的作用就是使用m到n次子解析器进行内容匹配，并递归处理m到n次匹配到的内容。

## [many0](https://docs.rs/nom/7.1.3/nom/multi/fn.many0.html)

Repeats the embedded parser, gathering the results in a `Vec`.

```rust
use nom::multi::many0;
use nom::bytes::complete::tag;

fn parser(s: &str) -> IResult<&str, Vec<&str>> {
  many0(tag("abc"))(s)
}

assert_eq!(parser("abcabc"), Ok(("", vec!["abc", "abc"])));
assert_eq!(parser("abc123"), Ok(("123", vec!["abc"])));
assert_eq!(parser("123123"), Ok(("123123", vec![])));
assert_eq!(parser(""), Ok(("", vec![])));
```

many0的作用是使用子解析器匹配0到n次，直到不能匹配了为止，将每次匹配到的内容收集到一个vec当中，并将这个vec作为many0的输出结果。

## [many1](https://docs.rs/nom/7.1.3/nom/multi/fn.many1.html)

Runs the embedded parser, gathering the results in a `Vec`.

```rust
use nom::multi::many1;
use nom::bytes::complete::tag;

fn parser(s: &str) -> IResult<&str, Vec<&str>> {
  many1(tag("abc"))(s)
}

assert_eq!(parser("abcabc"), Ok(("", vec!["abc", "abc"])));
assert_eq!(parser("abc123"), Ok(("123", vec!["abc"])));
assert_eq!(parser("123123"), Err(Err::Error(Error::new("123123", ErrorKind::Tag))));
assert_eq!(parser(""), Err(Err::Error(Error::new("", ErrorKind::Tag))));
```

many1的作用是使用子解析器匹配1到n次，直到不能匹配位置，将每次匹配到的内容收集到一个vec当中，并将这个vec作为many1的输出结果。

## [many_m_n](https://docs.rs/nom/7.1.3/nom/multi/fn.many_m_n.html)

Repeats the embedded parser `m..=n` times.

```rust
use nom::multi::many_m_n;
use nom::bytes::complete::tag;

fn parser(s: &str) -> IResult<&str, Vec<&str>> {
  many_m_n(0, 2, tag("abc"))(s)
}

assert_eq!(parser("abcabc"), Ok(("", vec!["abc", "abc"])));
assert_eq!(parser("abc123"), Ok(("123", vec!["abc"])));
assert_eq!(parser("123123"), Ok(("123123", vec![])));
assert_eq!(parser(""), Ok(("", vec![])));
assert_eq!(parser("abcabcabc"), Ok(("abc", vec!["abc", "abc"])));
```

`many_m_n`的作用是使用子解析器匹配m到n次，如果匹配成功后，将匹配的内容收集到vec当中，并作为`many_m_n`的输出结果。

## [many_till](https://docs.rs/nom/7.1.3/nom/multi/fn.many_till.html)

Applies the parser `f` until the parser `g` produces a result.

```rust
use nom::multi::many_till;
use nom::bytes::complete::tag;

fn parser(s: &str) -> IResult<&str, (Vec<&str>, &str)> {
  many_till(tag("abc"), tag("end"))(s)
};

assert_eq!(parser("abcabcend"), Ok(("", (vec!["abc", "abc"], "end"))));
assert_eq!(parser("abc123end"), Err(Err::Error(Error::new("123end", ErrorKind::Tag))));
assert_eq!(parser("123123end"), Err(Err::Error(Error::new("123123end", ErrorKind::Tag))));
assert_eq!(parser(""), Err(Err::Error(Error::new("", ErrorKind::Tag))));
assert_eq!(parser("abcendefg"), Ok(("efg", (vec!["abc"], "end"))));
```

`many_till`的作用是使用子解析器多次匹配内容，不断匹配，直到匹配到第二个子解析器匹配到的内容停止匹配。将这之间每次匹配到的内容收集到vec当中，并把这个vec和第二个子解析器匹配到的内容收集到一个元组当中，作为`many_till`的输出结果。

## [separated_list0](https://docs.rs/nom/7.1.3/nom/multi/fn.separated_list0.html)

Alternates between two parsers to produce a list of elements.

```rust
use nom::multi::separated_list0;
use nom::bytes::complete::tag;

fn parser(s: &str) -> IResult<&str, Vec<&str>> {
  separated_list0(tag("|"), tag("abc"))(s)
}

assert_eq!(parser("abc|abc|abc"), Ok(("", vec!["abc", "abc", "abc"])));
assert_eq!(parser("abc123abc"), Ok(("123abc", vec!["abc"])));
assert_eq!(parser("abc|def"), Ok(("|def", vec!["abc"])));
assert_eq!(parser(""), Ok(("", vec![])));
assert_eq!(parser("def|abc"), Ok(("def|abc", vec![])));
```

separated_list0的作用是不断匹配第二个子解析器的内容，当第二个子解析器匹配成功之后发现之后有第一个子解析器匹配到的内容，以次作为分隔符进行分割，每分割一次，就将以分隔符分隔开的内容收集到vec中，并让vec成为separated_list0的输出结果。允许没有匹配的情况，此时返回空vec。

## [separated_list1](https://docs.rs/nom/7.1.3/nom/multi/fn.separated_list1.html)

Alternates between two parsers to produce a list of elements until `Err::Error`.

```rust
use nom::multi::separated_list1;
use nom::bytes::complete::tag;

fn parser(s: &str) -> IResult<&str, Vec<&str>> {
  separated_list1(tag("|"), tag("abc"))(s)
}

assert_eq!(parser("abc|abc|abc"), Ok(("", vec!["abc", "abc", "abc"])));
assert_eq!(parser("abc123abc"), Ok(("123abc", vec!["abc"])));
assert_eq!(parser("abc|def"), Ok(("|def", vec!["abc"])));
assert_eq!(parser(""), Err(Err::Error(Error::new("", ErrorKind::Tag))));
assert_eq!(parser("def|abc"), Err(Err::Error(Error::new("def|abc", ErrorKind::Tag))));
```

separated_list1的作用同separated_list0，只不过是必须匹配上1次，否则匹配出错。
