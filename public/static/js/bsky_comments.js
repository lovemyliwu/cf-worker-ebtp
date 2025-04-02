export class BlueskyComments extends HTMLElement {
    static properties = {
      /** The URL of the Bluesky post to use as the parent */
      url: { type: String },
      // default to public.api.bsky.app
      api_origin: { type: String },
      // default to bsky.app
      app_host: { type: String },
      // default to official mod
      labelers: { type: String },
    };

    #observer;
    #loaded = false;
    #hiddenReplies = new Set();
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.did = undefined
      this.rkey = undefined
      this.shadowRoot.innerHTML = /*html*/ `
    <style>
      :host {
        --bluesky-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        --bluesky-font-size: 16px;
          --bluesky-text-color: #333;
        --bluesky-handle-color: #888;
        --bluesky-footer-text-color: rgb(111, 134, 159);
          --bluesky-bg-color: #fff;
        --bluesky-hover-bg: #f0f0f0;
        --bluesky-spacing-xs: 5px;
        --bluesky-spacing-sm: 8px;
        --bluesky-spacing-md: 10px;
        --bluesky-spacing-lg: 15px;
        --bluesky-avatar-size: 24px;
        --bluesky-avatar-bg: #e0e0e0;

        /* Comments Structure */
        --bluesky-reply-border-width: 2px;

        /* Footer */
        --bluesky-footer-font-size: 15px;
        --bluesky-icon-size: 18px;
        --bluesky-border-color: #e0e0e0;

      }

      /* Container Styles */
      .comments {
        font-family: var(--bluesky-font-family);
          font-size: var(--bluesky-font-size);
          background-color: var(--bluesky-bg-color);
        border: 1px solid var(--bluesky-border-color);
        color: var(--bluesky-text-color);
      }

      /* Comment Structure */
      .comment {
        border-bottom: 1px solid var(--bluesky-border-color);
        padding-top: var(--bluesky-spacing-lg);
        position: relative;
      }

      .comment .comment-author {
        position: absolute;
        left: calc(var(--bluesky-avatar-size)*1.5);
        top: var(--bluesky-avatar-size);
        background: white;
        border-radius: 50%;
        width: calc(var(--bluesky-avatar-size)/2);
        height: calc(var(--bluesky-avatar-size)/2);
        color: gray;
      }

      .comment.reply {
        border-left: var(--bluesky-reply-border-width) solid var(--bluesky-border-color);
        margin-left: var(--bluesky-spacing-lg);
      padding-top: var(--bluesky-spacing-xs);
      }

      .comment:last-child {
        border-bottom: none;
      }

    .comment-content {
      padding: var(--bluesky-spacing-xs) 0;
    }

      .avatar {
        width: var(--bluesky-avatar-size);
        height: var(--bluesky-avatar-size);
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid var(--bluesky-border-color);
      }

      .default-avatar {
        width: var(--bluesky-avatar-size);
        height: var(--bluesky-avatar-size);
        border-radius: 50%;
        background-color: var(--bluesky-avatar-bg);
      }

      .comment-header {
        display: flex;
        align-items: center;
        gap: var(--bluesky-spacing-md);
        padding: 0 var(--bluesky-spacing-lg);
      }


      .comment-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--bluesky-spacing-xs);
        font-size: var(--bluesky-footer-font-size);
        color: var(--bluesky-footer-text-color);
        padding: var(--bluesky-spacing-xs);
      }

      .comment-footer div {
        display: flex;
        align-items: center;
        gap: var(--bluesky-spacing-xs);
      }

      .comment-link {
        display: flex;
        flex-direction: column;
        color: inherit;
        text-decoration: none;
        padding: 0 var(--bluesky-spacing-lg);
      }

      .profile-link {
        color: var(--bluesky-text-color);
          font-weight: 600;
        text-decoration: none;
      }

      .timestamp-link,
      .handle-link {
        color: var(--bluesky-handle-color);
        text-decoration: none;
      }

      .comment-link:hover,
      .comment-footer:hover {
        background-color: var(--bluesky-hover-bg);
      }

      .profile-link:hover {
          text-decoration: underline;
      }

      .handle {
        color: var(--bluesky-handle-color);
      }

      .comment-footer svg {
        width: var(--bluesky-icon-size);
        height: var(--bluesky-icon-size);
        color: var(--bluesky-footer-text-color);
      }
      
      .text-sm {
          font-size: .875rem;
          line-height: 1.25rem;
      }
      .pt-2\.5 {
          padding-top: .625rem;
      }
      .border-t {
          border-top-width: 1px;
      }
      .gap-5 {
          gap: 1.25rem;
      }
      .items-center {
          align-items: center;
      }
      .cursor-pointer {
          cursor: pointer;
      }
      .flex {
          display: flex;
      }
      .flex-1 {
          flex: 1 1 0%;
      }
      .w-5 {
          width: 1.25rem;
      }
      .h-5 {
          height: 1.25rem;
      }
      .status-bar {
        padding: 0 var(--bluesky-spacing-lg);
        background-color: #f3f3f3;
      }
    </style>
    <div class="status-bar border-t dark:border-slate-600 w-full pt-2.5 flex items-center gap-5 text-sm ">
    <div class=" flex gap-2 items-center">
    <img src="data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20fill='none'%20viewBox='0%200%2024%2024'%3e%3cpath%20fill='%23ec4899'%20d='M12.489%2021.372c8.528-4.78%2010.626-10.47%209.022-14.47-.779-1.941-2.414-3.333-4.342-3.763-1.697-.378-3.552.003-5.169%201.287-1.617-1.284-3.472-1.665-5.17-1.287-1.927.43-3.562%201.822-4.34%203.764-1.605%204%20.493%209.69%209.021%2014.47a1%201%200%200%200%20.978%200Z'/%3e%3c/svg%3e" class="w-5 h-5">
    <p class="like font-bold text-neutral-500 dark:text-neutral-300 mb-px" style="">0</p></div>
    <div class="flex items-center gap-2 ">
    <img src="data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20fill='none'%20viewBox='0%200%2024%2024'%3e%3cpath%20fill='%2320bc07'%20d='M17.957%202.293a1%201%200%201%200-1.414%201.414L17.836%205H6a3%203%200%200%200-3%203v3a1%201%200%201%200%202%200V8a1%201%200%200%201%201-1h11.836l-1.293%201.293a1%201%200%200%200%201.414%201.414l2.47-2.47a1.75%201.75%200%200%200%200-2.474l-2.47-2.47ZM20%2012a1%201%200%200%201%201%201v3a3%203%200%200%201-3%203H6.164l1.293%201.293a1%201%200%201%201-1.414%201.414l-2.47-2.47a1.75%201.75%200%200%201%200-2.474l2.47-2.47a1%201%200%200%201%201.414%201.414L6.164%2017H18a1%201%200%200%200%201-1v-3a1%201%200%200%201%201-1Z'/%3e%3c/svg%3e" class="w-5 h-5">
    <p class="quote font-bold text-neutral-500 dark:text-neutral-300 mb-px">0</p></div>
    <div class="flex items-center gap-2 "><img src="data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20fill='none'%20viewBox='0%200%2024%2024'%3e%3cpath%20fill='rgb(10,122,255)'%20d='M19.002%203a3%203%200%200%201%203%203v10a3%203%200%200%201-3%203H12.28l-4.762%202.858A1%201%200%200%201%206.002%2021v-2h-1a3%203%200%200%201-3-3V6a3%203%200%200%201%203-3h14Z'/%3e%3c/svg%3e" class="w-5 h-5">
    <p class="reply font-bold text-neutral-500 dark:text-neutral-300 mb-px">0</p></div>
    <div class="flex-1"></div>
    <a class="join-reply cursor-pointer text-brand dark:text-brandLighten font-bold hover:underline hidden min-[450px]:inline" href="#">加入讨论→</a></div>
    <div class="comments"></div>
      `;
      this.#observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !this.#loaded) {
              this.#loadComments();
              this.#loaded = true;
              this.#observer.disconnect();
            }
          });
        },
        { threshold: 0.1 },
      );
    }

    connectedCallback() {
      this.#observer.observe(this);
    }

    disconnectedCallback() {
      this.#observer.disconnect();
    }

    async #loadComments() {
      const blueskyUrl = this.getAttribute("url");
      if (blueskyUrl) {
        try {
          const atUri = await this.#resolvePostUrl(blueskyUrl);
          if (!atUri) {
            throw new Error("Failed to resolve AT URI");
          }
          let [did, _, rkey] = atUri.slice('at://'.length).split('/')
          this.did = did
          this.rkey = rkey
          const { thread, threadgate } = await this.#fetchReplies(atUri);
          this.#hiddenReplies = new Set(threadgate?.record?.hiddenReplies || []);
          this.#displayReplies(thread);
        } catch (e) {
          this.shadowRoot.querySelector(".comments").innerHTML =
            `<p>Error loading comments.</p>`;
        }
      } else {
        this.shadowRoot.querySelector(".comments").innerHTML =
          `<p>No Bluesky URL provided.</p>`;
      }
    }

    async #resolvePostUrl(postUrl) {
      let atUri;

      if (postUrl.startsWith("at:")) {
        return postUrl;
      }

      if (!/https:\/\/.+?\/profile\/.+?\/post\/.+?/.test(postUrl)) {
        return undefined;
      }

      const urlParts = new URL(postUrl).pathname.split("/");
      let did = urlParts[2];
      const postId = urlParts[4];

      if (!did || !postId) {
        return undefined;
      }

      if (!did.startsWith("did:")) {
        const cachedDid = this.#getCache(`handle:${did}`);
        if (cachedDid) {
          did = cachedDid;
        } else {
          let instance = this.getAttribute('api_origin') ?? 'https://api.bsky.app'
          try {
            const handleResolutionUrl = `${instance}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(
              did,
            )}`;
            const handleResponse = await fetch(handleResolutionUrl);

            if (!handleResponse.ok) {
              throw new Error("Failed to resolve handle");
            }

            const handleData = await handleResponse.json();
            if (!handleData.did) {
              return undefined;
            }

            this.#setCache(`handle:${did}`, handleData.did, 86400);
            did = handleData.did;
          } catch (e) {
            console.error(`[error] Failed to resolve handle: ${e.message || e}`);
            return undefined;
          }
        }
      }

      atUri = `at://${did}/app.bsky.feed.post/${postId}`;
      return atUri;
    }

    #setCache(key, value, ttl = 86400) {
      const expiry = Date.now() + ttl * 1000;
      const cacheData = { value, expiry };
      localStorage.setItem(key, JSON.stringify(cacheData));
    }

    #getCache(key) {
      const cachedItem = localStorage.getItem(key);
      if (!cachedItem) return null;

      const { value, expiry } = JSON.parse(cachedItem);
      if (Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return value;
    }

    async #fetchReplies(atUri) {
      let instance = this.getAttribute("api_origin") ?? 'https://api.bsky.app'
      const apiUrl = `${instance}/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(
        atUri,
      )}`;
      let headers = {'atproto-accept-labelers': this.getAttribute("labelers") ?? 'did:plc:ar7c4by46qjdydhdevvrndac;redact'}
      const response = await fetch(apiUrl, {headers});
      if (!response.ok) {
        throw new Error("Failed to fetch replies");
      }
      return response.json();
    }

    async #displayReplies(thread, container = null) {
      let instance = this.getAttribute("app_host") ?? 'bsky.app'
      const commentsContainer =
        container || this.shadowRoot.querySelector(".comments");
      
      this.shadowRoot.querySelector('.status-bar .like').innerText = thread.post.likeCount
      this.shadowRoot.querySelector('.status-bar .quote').innerText = thread.post.quoteCount + thread.post.repostCount
      this.shadowRoot.querySelector('.status-bar .reply').innerText = thread.post.replyCount
      this.shadowRoot.querySelector('.status-bar .join-reply').setAttribute('href', `https://${instance}/profile/${this.did}/post/${this.rkey}`)

      if (thread && thread.replies && thread.replies.length > 0) {
        const sortedReplies = thread.replies.sort((a, b) => {
          return (
            new Date(a.post.record.createdAt).getTime() -
            new Date(b.post.record.createdAt).getTime()
          );
        });
        sortedReplies.forEach((reply) => {
          this.#displayComments(reply, commentsContainer, false);
        });
      } else {
        this.shadowRoot.querySelector(".comments").innerHTML =
          `<p>成为第一个评论的用户，抢<a href="https://${instance}/profile/${this.did}/post/${this.rkey}">沙发🛋</a></p>`;
      }
    }

    #sanitizeText(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }

    #displayComments(thread, container, isReply = false) {
      if (thread?.post?.author && thread.post.record) {
        // Skip if the post is hidden by the original poster or if it's just a pin emoji
        if (
          thread.post.record.text.trim() === "📌" ||
          this.#hiddenReplies.has(thread.post.uri)
        ) {
          return;
        }

        const commentDiv = document.createElement("div");
        commentDiv.classList.add("comment");
        if (isReply) {
          commentDiv.classList.add("reply");
        }

        const authorHandle = thread.post.author.handle;
        let instance = this.getAttribute('app_host') ?? 'bsky.app'
        let isMod = thread.post.author.did === this.did
        const authorProfileUrl = `https://${instance}/profile/${thread.post.author.did}`;
        const postUrl = `https://${instance}/profile/${
          thread.post.author.did
        }/post/${thread.post.uri.split("/").pop()}`;
        const createdAt = new Date(thread.post.record.createdAt);
        const createdAtFull = createdAt.toLocaleString();
        const createdAtAbbreviated = this.#getAbbreviatedTime(createdAt);
        const avatarUrl = thread.post?.author?.avatar?.replace(
          "/img/avatar/",
          "/img/avatar_thumbnail/",
        );
        const displayName = thread.post.author.displayName || authorHandle;
        const likeCount = thread.post.likeCount || 0;
        const repostCount = thread.post.repostCount || 0;
        const replyCount = thread.post.replyCount || 0;

        let avatarElement;
        if (avatarUrl) {
          avatarElement = `<img src="${avatarUrl}" alt="${authorHandle}'s avatar" class="avatar" part="avatar"/>`;
        } else {
          avatarElement = `<div class="default-avatar" part="avatar"></div>`;
        }
        const modSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" class="comment-author"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z"></path></svg>'
        commentDiv.innerHTML = `
          <div class="comment-header" part="comment-header">
            ${avatarElement}${ isMod ? modSvg : ''}
            <div>
              <a href="${authorProfileUrl}" target="_blank" class="profile-link">${this.#sanitizeText(displayName)}</a>
              <span class="handle"><a href="${authorProfileUrl}" target="_blank" class="handle-link">@${this.#sanitizeText(authorHandle)}</a></span> -
              <a href="${postUrl}" target="_blank" rel="ugc" title="${createdAtFull}" class="timestamp-link">${createdAtAbbreviated}</a>
            </div>
          </div>
          <div class="comment-body" part="comment-body">
            <a href="${postUrl}" target="_blank" rel="nofollow noopener" class="comment-link">
              <div class="comment-content" part="comment-content">
                ${this.#sanitizeText(thread.post.record.text)}
              </div>
              <div class="comment-footer" part="comment-footer">
                <div>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M2.002 6a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H12.28l-4.762 2.858A1 1 0 0 1 6.002 21v-2h-1a3 3 0 0 1-3-3V6Zm3-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2a1 1 0 0 1 1 1v1.234l3.486-2.092a1 1 0 0 1 .514-.142h7a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-14Z"></path>
                  </svg>
                  <span>${replyCount}</span>
                </div>
                <div>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M17.957 2.293a1 1 0 1 0-1.414 1.414L17.836 5H6a3 3 0 0 0-3 3v3a1 1 0 1 0 2 0V8a1 1 0 0 1 1-1h11.836l-1.293 1.293a1 1 0 0 0 1.414 1.414l2.47-2.47a1.75 1.75 0 0 0 0-2.474l-2.47-2.47ZM20 12a1 1 0 0 1 1 1v3a3 3 0 0 1-3 3H6.164l1.293 1.293a1 1 0 1 1-1.414 1.414l-2.47-2.47a1.75 1.75 0 0 1 0-2.474l2.47-2.47a1 1 0 0 1 1.414 1.414L6.164 17H18a1 1 0 0 0 1-1v-3a1 1 0 0 1 1-1Z"></path>
                  </svg>
                  <span>${repostCount}</span>
                </div>
                <div>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M16.734 5.091c-1.238-.276-2.708.047-4.022 1.38a1 1 0 0 1-1.424 0C9.974 5.137 8.504 4.814 7.266 5.09c-1.263.282-2.379 1.206-2.92 2.556C3.33 10.18 4.252 14.84 12 19.348c7.747-4.508 8.67-9.168 7.654-11.7-.541-1.351-1.657-2.275-2.92-2.557Zm4.777 1.812c1.604 4-.494 9.69-9.022 14.47a1 1 0 0 1-.978 0C2.983 16.592.885 10.902 2.49 6.902c.779-1.942 2.414-3.334 4.342-3.764 1.697-.378 3.552.003 5.169 1.286 1.617-1.283 3.472-1.664 5.17-1.286 1.927.43 3.562 1.822 4.34 3.764Z"></path>
                  </svg>
                  <span>${likeCount}</span>
                </div>
              </div>
            </a>
          </div>
        `;

        container.appendChild(commentDiv);

        if (thread.replies && thread.replies.length > 0) {
          const sortedReplies = thread.replies.sort((a, b) => {
            return (
              new Date(a.post.record.createdAt).getTime() -
              new Date(b.post.record.createdAt).getTime()
            );
          });
          sortedReplies.forEach((reply) => {
            this.#displayComments(reply, commentDiv, true);
          });
        }
      }
    }

    #getAbbreviatedTime(date) {
      const now = new Date().getTime();
      const diffMs = now - date;
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays}d`;
      } else if (diffHours > 0) {
        return `${diffHours}h`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes}m`;
      } else {
        return `${diffSeconds}s`;
      }
    }
  }
  customElements.define("bluesky-comments", BlueskyComments);
