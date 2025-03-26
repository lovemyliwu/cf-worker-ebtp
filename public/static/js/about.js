import * as utils from '/static/js/common.js'
const response = await fetch('/config')
const config = await response.json()
utils.renderAvatar(config)
utils.renderJSONLD({
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "dateCreated": config.createdAt,
  "dateModified": config.indexedAt,
  "mainEntity": {
    "@type": "Person",
    "name": config.displayName,
    "identifier": config.did,
    "interactionStatistic": [{
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/FollowAction",
      "userInteractionCount": config.followersCount
    }],
    "agentInteractionStatistic": [{
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/WriteAction",
      "userInteractionCount": config.postsCount
    },{
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/FollowAction",
      "userInteractionCount": config.followsCount
    }],
    "description": config.description,
    "image": config.avatar,
    "sameAs": [
      `${location.origin}/about`,
      `https://${config.app_host}/profile/${config.handle}`
    ]
  }
})
await utils.initBackgroundPic()
