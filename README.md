# react-native-gifencoder

[![npm version](http://img.shields.io/npm/v/react-native-gifencoder.svg?style=flat-square)](https://npmjs.org/package/react-native-gifencoder "View this project on npm")
[![npm downloads](http://img.shields.io/npm/dm/react-native-gifencoder.svg?style=flat-square)](https://npmjs.org/package/react-native-gifencoder "View this project on npm")
[![npm licence](http://img.shields.io/npm/l/react-native-gifencoder.svg?style=flat-square)](https://npmjs.org/package/react-native-gifencoder "View this project on npm")
[![Platform](https://img.shields.io/badge/platform-ios%20%7C%20android%20%7C%20web-989898.svg?style=flat-square)](https://npmjs.org/package/react-native-gifencoder "View this project on npm")

Pure JavaScript HTML5 `<canvas>` or ImageData to (Animated) GIF Conversion for React Native.

Based on [as3gif](http://code.google.com/p/as3gif/) Ported by [Kevin Kwok](http://antimatter15.com).

![This is the raw canvas element saved as a non-animated PNG](Demos/raw_canvas.png)
![This is the GIF which was generated from the canvas.](Demos/converted_animation.gif)
![This is the GIF which was generated from the canvas.](Demos/clock.gif)

> AS3GIF lets you play and encode animated GIF's with ActionScript 3

Since web pages can usually natively play GIFs fine, it's only a port of the GIFEncoder
portions of the library.

Basic Usage
============

Since it pretty much *is* GIFEncoder, you could consult the [as3gif how-to page](http://code.google.com/p/as3gif/wiki/How_to_use#The_GIFEncoder).

But there are some differences so I'll cover it here anyway.

You first need to include the JS files.

    import {GIFEncoder, encode64} from 'react-native-gifencoder';

If you want to render the gif through `<Image>` or try to save to disk or send to server or anything that requires
conversion into a non-binary string form, you can use `encode64` too.

Simple enough right? Now to convert stuff to GIF, you need to have a working [@flyskywhy/react-native-gcanvas](https://github.com/flyskywhy/react-native-gcanvas) (or `<canvas>` on Web) or at least some imageData-esque array.

We need to init the GIFEncoder.

    var encoder = new GIFEncoder();

*If* you are making an animated gif, you need to add the following:

    encoder.setRepeat(0); // 0  -> loop forever
                          // 1+ -> loop n times then stop
    encoder.setDelay(500); // go to next frame every n milliseconds

Now, you need to tell the magical thing that you're gonna start inserting frames (even if it's only one).

    encoder.start();

And for the part that took the longest to port: adding a real frame.

    encoder.addFrame(canvas_context);

or

    encoder.setSize(width, height);
    encoder.addFrame(fake_imageData, true);

In the original GIFEncoder version, it accepts a Bitmap. Well, that doesn't exist in Javascript (natively, anyway)
so instead, I use what I feel is a decent analogue: the canvas context. However, if you're in a situation
where you don't have a real `<canvas>` element. That's _okay_. You can set the second parameter to true and
pass a imageData.data-esque array as your first argument. So in other words, you can do `encoder.addFrame(fake_imageData, true)`
as an alternative. However, you _must_ do an `encoder.setSize(width, height);` before you do any of the addFrames if you
pass a imageData.data-like array. If you pass a canvas context, then that's all okay, because it will automagically do a
setSize with the canvas width/height stuff.

Now the last part is to finalize the animation and get it for display.

If only 1 frame in GIF, just

      encoder.finish();

      //var binary_gif_number_array = encoder.stream().bin;
      var binary_gif_ascii_string = encoder.stream().getData() // notice this is different from the as3gif package!
      var data_url = 'data:image/gif;base64,' + encode64(binary_gif_ascii_string);

If more than 1 frame in GIF, ref to WebWorkers below.

Docs
====

There's three files, but two of them are more of supporting libraries that I don't totally understand or care about enough
to document. So I'm just gonna document GIFEncoder.

`new GIFEncoder()` This is super parent function. You really don't need the `new` keyword because It's not really even using
any special inheritance pattern. It's a closure that does some `var blah = exports.blah = function blah(){` for no good reason.
Anyway, it returns an object with a bunch of methods that the section will be devoted to documenting. Note that I've never tested
more than half of these, so good luck.

`Boolean start()` This writes the GIF Header and returns `false` if it fails.

`Boolean addFrame(CanvasRenderingContext2D context)` This is the magical magic behind everything. This adds a frame.

`Boolean addFrame(CanvasPixelArray image, true)` This is the magical magic behind everything. This adds a frame. This time you need
pass `true` as the second argument and then magic strikes and it loads your canvas pixel array (which can be a real array, I don't
care and I think the program has learned from my constant apathy to also not care). But note that if you do, you must first manually call
`setSize` which is happily defined just below this one.

`void setSize(width, height)` Sets the canvas size. It's supposed to be private, but I'm exposing it anyway. Gets called automagically
as the size of the first frame if you don't do that crappy hacky imageData.data hack.

`void setDelay(int milliseconds)` the number of milliseconds to wait on each frame

`void setDispose(int code)` Sets the GIF frame disposal code for the last added frame and any
subsequent frames. Default is 0 if no transparent color has been set, otherwise 2. I have no clue what this means so I just copypasted
it from the actionscript docs.

`void setFrameRate(Number fps)` Sets frame rate in frames per second. Equivalent to `setDelay(1000/fps)`. I think that's stupid.

`void setQuality(int quality)` Sets quality of color quantization (conversion of images to the maximum 256 colors allowed by the
GIF specification). Lower values (minimum = 1) produce better colors, but slow processing significantly. 10 is the default, and produces
good color mapping at reasonable speeds. Values greater than 20 do not yield significant improvements in speed. BLAH BLAH BLAH. Whatever

`void setRepeat(int iter)` Sets the number of times the set of GIF frames should be played. Default is 1; 0 means play indefinitely.
Must be invoked before the first image is added.

`void setTransparent(Number color)` Sets the transparent color for the last added frame and any subsequent
frames. Since all colors are subject to modification in the quantization
process, the color in the final palette for each frame closest to the given
color becomes the transparent color for that frame. May be set to null to
indicate no transparent color.

`void setComment(String comment)` Can replace the default 'Generated by jsgif (https://github.com/antimatter15/jsgif/)'.

`ByteArray finish()` Adds final trailer to the GIF stream, if you don't call the finish method the GIF stream will not be valid.

`String stream()` Yay the only function that returns a non void/boolean. It's the magical stream function which should have been a getter which JS does
support but I didnt' feel like making it a getter because getters are so weird and inconsistent. Like sure there's the nice pretty `get` thing
but I think IE9/8 doesn't implement it because it's non standard or something and replaced it with a hideously ugly blah blah. So Anyway, it's a function.
It returns a byteArray with three writeByte functions that you wouldn't care about and a `getData()` function which returns a binary string with the GIF.
There's also a `.bin` attribute which contains an array with the binary stuff that I don't care about.


WebWorkers
============

The process isn't really the fastest thing ever, so you should
use WebWorkers for piecing together animations more than a few frames
long.

Ref to how <https://github.com/flyskywhy/PixelShapeRN/blob/master/src/workers/workerPool.js> let `generateGif.worker.js` works
on Android iOS with `@minar-kotonoha/react-native-threads` and on Web with `codegen.macro`.

Here's some incomplete mock-JS which
should be able to do stuff once you add the boring stuff like serializing
and deserializing the content (actually, I have most of the serializing done
but you have to deserialize that and that's really the boring part).

    // on the worker side:
    var frame_index,
        frame_length,
        height,
        width,
        imageData; // get it from onmessage
    var encoder = new GIFEncoder(); // create a new GIFEncoder for every new job
    if (frame_index === 0) {
      encoder.start();
    } else {
      encoder.setProperties(true, fasle); // started, firstFrame
    }
    encoder.setSize(height, width);
    encoder.addFrame(imageData, true);
    if (frame_length === frame_index + 1) {
      encoder.finish();
    }
    postMessage(frame_index + encoder.stream().getData())
    const res = {
      frame_index,
      frameData: encoder.stream().getData(),
    };
    self.postMessage(JSON.stringify(res)); // now can be used on the <View> side


    // on the canvas side:
    var animation_parts = new Array(frame_length);
    var worker = new WebWorker('blahblahblah.js');
    worker.onmessage = function(e){
      // handle stuff, like get the frame_index
      animation_parts[frame_index] = frame_data;
      // check when everything else is done and then do animation_parts.join('') and have fun
    }
    var imdata = context.getImageData(0, 0, canvas.width, canvas.height);
    var len = canvas.width * canvas.height * 4;
    var imarray = [];
    for (var i = 0; i < len; i++) {
      imarray.push(imdata[i]);
    }
    worker.postMessage(frame_index + ';' + frame_length + ';' + canvas.height + ';' + canvas.width + ';' + imarray.join(','))
