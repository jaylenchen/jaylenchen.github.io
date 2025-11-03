<template>
  <div class="home">
    <header class="intro">
      <p class="intro__kicker">jaylenchen</p>
      <p>一个软件工程爱好者，喜欢钻研、学习程序设计，热爱生活。</p>
    </header>

    <nav class="quick-links" aria-label="Site shortcuts">
      <a href="/life/GTD时间管理">生活修炼</a>
      <a href="/tags/">主题标签</a>
      <a href="/archives/">全部归档</a>
    </nav>

    <section class="lead">
      <figure>
        <img src="/life/gtd-process2.png" alt="GTD Process" />
        <figcaption>Getting Things Done — 让长线目标切实落地的工具链。</figcaption>
      </figure>
    </section>

    <section class="contact" aria-label="Contact">
      <h2>联系我</h2>
      <p>如果你想交流产品想法、效率工具或是一起做点有趣的事，随时来信。</p>
      <ul>
        <li>
          <span class="label">Email</span>
          <a href="mailto:jaylen-work@outlook.com">jaylen-work@outlook.com</a>
        </li>
        <li>
          <span class="label">WeChat</span>
          <span class="value">code-mvp</span>
        </li>
      </ul>
    </section>
  </div>
</template>

 <style scoped>
.home {
  max-width: 720px;
  margin: 1.5rem auto 8rem;
  padding: 0 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 3.5rem;
  color: var(--vp-c-text-1);
}

.intro {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.intro__kicker {
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
}

.intro h1 {
  margin: 0;
  font-size: clamp(2.4rem, 4vw, 3rem);
  line-height: 1.1;
}

.intro p {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.8;
  color: var(--vp-c-text-2);
}

.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  font-size: 0.95rem;
}

.quick-links a {
  text-decoration: none;
  color: inherit;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--vp-c-divider);
  transition: border-color 0.2s ease, color 0.2s ease;
}

.quick-links a:hover {
  color: var(--vp-c-brand-1, #3e63dd);
  border-color: currentColor;
}

.lead figure {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lead img {
  width: 100%;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.lead figcaption {
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
}

.contact {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.contact h2 {
  margin: 0;
  font-size: 1.4rem;
}

.contact p {
  margin: 0;
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  line-height: 1.7;
}

.contact ul {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.contact li {
  display: flex;
  gap: 0.75rem;
  font-size: 0.95rem;
}

.label {
  min-width: 4.5rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.value,
.contact a {
  color: inherit;
  text-decoration: none;
}

.contact a:hover {
  color: var(--vp-c-brand-1, #3e63dd);
}

@media (max-width: 600px) {
  .home {
    margin: 1.5rem auto 6rem;
    padding: 0 1.25rem;
    gap: 3rem;
  }

  .contact li {
    flex-direction: column;
    gap: 0.25rem;
  }

  .label {
    min-width: auto;
  }
}
 </style>