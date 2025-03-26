import { isTid } from "./utils.js"

export class FooterRewriter {
  constructor(env) {
    this.env = env
  }

  element(element) {
    element.setInnerContent(this.env.WEB_PAGE_FOOTER)
  }
}

export class HTMLTagRewriter {
  constructor(env) {
    this.env = env
  }

  element(element) {
    element.setAttribute('lang', this.env.WEB_PAGE_CONTENT_LANGUAGE)
  }
}

export class AppTitleRewriter {
  constructor(env) {
    this.env = env
  }

  element(element) {
    element.setInnerContent(this.env.WEB_APP_TITLE)
  }
}

export class TitleRewriter {
  constructor(env, url) {
    this.env = env
    this.url = new URL(url)
  }

  element(element) {
    if (this.url.pathname === '/') {
      element.setInnerContent(this.env.WEB_APP_TITLE)
    } else if (isTid(this.url.pathname.slice(1)) || this.url.pathname === '/search') {
      element.setInnerContent(this.env.WEB_PAGE_TITLE)
    } else if (this.url.pathname === '/about') {
      element.setInnerContent(`关于 - ${this.env.WEB_APP_TITLE}`)
    } else {
      element.setInnerContent(`页面未找到 - ${this.env.WEB_APP_TITLE}`)
    }
  }
}
