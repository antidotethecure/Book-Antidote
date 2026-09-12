# CINE — scroll-pinned cinematic scenes

Full-screen scenes that pin to the viewport and play as the visitor scrolls, placed between the sections of any site. Two files, no dependencies:

```html
<link rel="stylesheet" href="cine/cine.css">
<script src="cine/cine.js"></script>
```

Each scene is a scroll track (`length` viewport-heights tall, default 200) with a canvas that stays pinned while you scroll through it. Scroll position becomes progress `p` (0 → 1) and the scene's renderer draws that moment. When the track ends the page hands off into the real section underneath.

## Two ways to drop a business in

**1. Config** (one call, keeps HTML untouched):

```html
<script>
CINE.mount({scenes:[
  {type:'cheese-drip', before:'#about',  length:180, kicker:'Drizzle. Bite. Repeat.', title:'The whole download'},
  {type:'star-zoom',   before:'#celebs', image:'star.jpg', fx:0.5, fy:0.2, kicker:'Co-signed by the culture', title:'Celebrity connections',
                       faces:function(){return [...document.querySelectorAll('#celebGrid img')].map(i=>i.src);}},
  {type:'stream-cam',  before:'#kick',   image:'studio.webp', fx:0.3, fy:0.36, kicker:'Live from the kitchen', title:'On Kick'},
  {type:'stage-zoom',  before:'#music',  image:'stage.jpg', crowd:'crowd.jpg', kicker:'Before the food', title:'There was the mic'},
  {type:'book-close',  before:'#ebook',  image:'cover.jpg', kicker:'Beyond the plate', title:'Wealth Blueprint'},
  {type:'coin-rain',   before:'#crypto', image:'tesla.jpg', kicker:'The other grind', title:'All in on crypto'}
]});
</script>
```

**2. Data attributes** (no JavaScript to write; call `CINE.mount()` with no arguments):

```html
<section id="team" data-cine="star-zoom" data-cine-image="img/star.jpg" data-cine-fx="0.5" data-cine-fy="0.2"
         data-cine-kicker="Our people" data-cine-title="Meet the team" data-cine-faces="#team img">
```

Every `data-cine-*` attribute becomes an option (`data-cine-image` → `image`). `data-cine-faces` takes a CSS selector.

## Scene types

| type | what happens | options |
|---|---|---|
| `cheese-drip` | Molten cheese pours down over the screen as one continuous fluid (GPU shader: sheet, tongues, bulbs and falling drops melt into each other, lit as a wet surface), then runs off the bottom. Falls back to a canvas drawing where WebGL2 is unavailable | `kicker`, `title` |
| `star-zoom` | Starts tight on the food, pulls back to the Walk of Fame star, then the co-sign faces fly in and orbit | `image`, `fx`, `fy` (start focus 0–1), `faces` (array of URLs or a function) |
| `stream-cam` | Inside a stream viewfinder (REC, LIVE count, bitrate, rolling chat), pulls out to the whole set | `image`, `fx`, `fy`, `chat` (array of strings) |
| `stage-zoom` | Tight on the mic, pulls out under sweeping stage lights, then the crowd photo wraps in | `image`, `crowd` |
| `book-close` | The book opens on the formula, closes, and cash starts falling | `image` (cover) |
| `coin-rain` | Pushes in on the photo while coins and bills pour down with a lightning flicker | `image`, `fx`, `fy` |

Common options: `before` (selector of the section the scene introduces), `length` (viewport heights, default 200), `kicker`, `title`, `mono` and `display` (font stacks).

## Adding your own scene

```js
CINE.register('my-scene',{
  init(s){ /* s.ctx, s.W, s.H, s.img (the `image` option, loaded), s.o (options) */ },
  draw(s,p,t){ /* p = scroll progress 0..1, t = seconds; draw onto s.ctx */ }
});
```

## Behaviour

- Scenes only render while near the viewport, so a page with many scenes stays cheap.
- Canvas is capped at 1.5× device pixel ratio. A scene can declare `gl:true` to get a WebGL2 canvas (plus a 2D overlay for captions); if WebGL2 is missing or its shaders fail, the engine swaps in the `<type>-2d` renderer when one is registered.
- `prefers-reduced-motion: reduce` removes the scenes entirely; the page reads normally.
- Images are loaded lazily per scene. Use the same relative paths the page already uses.
