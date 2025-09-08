
Deep Dive into the Node.js Event Loop
=====================================
![EventLoop](file:///C:/LeetCode-Tracker/notes/NodeJs/eventloop.drawio.png)

Introduction
------------

Node.js is known for its **single-threaded, non-blocking** architecture that can handle many concurrent operations. At the heart of this architecture lies the **Event Loop**, which is implemented in C/C++ via the `libuv` library. The event loop is essentially a continuously running loop in the Node runtime that handles asynchronous operations and callbacks in a **phased** manner[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=The%20event%20loop%20is%20what,the%20system%20kernel%20whenever%20possible). This mechanism allows Node to offload work to the operating system kernel or a **thread pool** (for file I/O, DNS, crypto, etc.) while the main thread remains free to process other tasks[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=1,handled%20in%20the%20thread%20pool)[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=read%2C%20a%20timer%20has%20timed,out%20etc). In simple terms, the event loop acts as a scheduler that picks up completed asynchronous tasks and executes their callbacks on the main JavaScript thread, without blocking the execution of other code.

When a Node.js process starts, it executes the main script synchronously (the **call stack** runs your top-level code). During this time, any asynchronous operations (like file reads, network requests, or timers) are initiated and handed off to the appropriate system or thread pool. Once the main script completes and the call stack is empty, Node enters the event loop. From this point, the event loop continuously checks for pending events or callbacks, executing them in a specific order defined by **phases**[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=Each%20phase%20has%20a%20FIFO,next%20phase%2C%20and%20so%20on)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=Phases%20Overview). The process repeats until there are no more pending tasks (no timers, no pending I/O or callbacks), at which point Node can exit gracefully[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=Between%20each%20run%20of%20the,if%20there%20are%20not%20any).

**Key components** we’ll explore in depth include:

*   The **Event Loop Phases** – six main phases (timers, pending callbacks, idle/prepare, poll, check, close callbacks) in which different types of callbacks are processed.
    
*   The **Call Stack** – where JavaScript functions execute (one at a time).
    
*   The **Task Queues (Callback Queues)** – where pending “macro-task” callbacks (from events, timers, I/O, etc.) wait to be executed.
    
*   The **Microtask Queue** – for high-priority “micro-task” callbacks (e.g. Promise resolutions and `process.nextTick` callbacks) that run _between_ or _within_ event loop ticks.
    
*   The **libuv Thread Pool** – a pool of threads (4 by default) for offloading expensive operations (file system calls, compression, DNS lookups, etc.), enabling true parallelism for those tasks outside the main thread.
    
*   The interplay between these components, including how **macrotasks vs microtasks** are scheduled and executed, and how Node’s behavior has evolved (with Node 11+ and Node 20) to align more closely with browser JavaScript in handling microtasks.
    

By relearning the Node.js event loop in detail, you’ll regain the ability to predict and trace the execution order of complex asynchronous code, ensuring you know _what runs first and why_ at each step.

Overview of Event Loop Phases
-----------------------------

The Node.js event loop has **six primary phases** that it iterates through on each tick of the loop. Each phase has a specific purpose and handles certain types of callbacks. When the event loop enters a phase, it will execute callbacks in that phase’s **FIFO queue** (first-in, first-out) until either the queue is exhausted or a platform-specific limit is reached[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=Each%20phase%20has%20a%20FIFO,next%20phase%2C%20and%20so%20on). Node then moves to the next phase. If new events or callbacks are queued in the meantime (including while processing the current phase), those will typically be handled in their appropriate phase on the next loop iteration (or even later in the same iteration if they are microtasks, as we’ll discuss). The phases always occur in the following order[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=,callbacks%20are%20invoked%20here):

_Illustration: **Node.js Event Loop Phases and Queues.** The event loop cycles through phases in order: **Timers → Pending Callbacks → Idle/Prepare → Poll → Check → Close Callbacks**, processing callbacks in each queue. The **microtask queues** (for `process.nextTick` and Promise callbacks) are processed between macrotask phases (often at the beginning or end of each phase, and after each callback) to ensure high-priority tasks are handled promptly. This diagram shows the six phases (in green) and two microtask queues (in blue)[builder.io](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop#:~:text=1,nextTickQueue%20and%20then%20Promise%20queue)[builder.io](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop#:~:text=6,tasks%20in%20the%20promise%20queue)._

### 1\. Timers Phase

**Timers** is the first phase. This phase executes callbacks scheduled by `setTimeout()` and `setInterval()` whose _threshold time has elapsed_[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=,will%20block%20here%20when%20appropriate). Importantly, the specified delay for timers is a **minimum threshold**, not an exact time guarantee. In other words, a timer set for 100ms will not run _before_ 100ms have passed, but it might run _later_ than 100ms depending on the state of the event loop (if the loop is busy with other tasks, the timer callback execution could be delayed). In this phase, Node will run all timer callbacks that are due to fire. For example, if you schedule a timeout with `setTimeout(fn, 0)`, the callback `fn` will be queued to execute in the timers phase of the _next_ iteration of the event loop (after the current code finishes executing)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20function%20passed%20to%20,setImmediate). If multiple timers expire at the same time, their callbacks are queued in order of scheduling (first scheduled, first served).

_Behind the scenes:_ Node internally uses a **min-heap** or similar structure to manage timers and determine which timers have expired. The **poll phase** (described later) actually controls when timers are checked – Node will only wait in the poll phase as long as the next upcoming timer’s threshold. Thus, an idle event loop will not block past the time a timer is due; the loop will wake and move to the timers phase when the earliest timer is ready[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=operation%20is%20completed%20is%3A)[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=until%20the%20earliest%20scheduled%20timer,look%20at%20some%20code%20examples). If the event loop is busy (e.g., executing a long callback), an expired timer’s callback will wait until the current JS execution and other preceding phases complete. In summary, the timers phase ensures that scheduled tasks (like timeouts and intervals) run as soon as possible after their delay has elapsed[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=,will%20block%20here%20when%20appropriate) (subject to the loop’s availability).

### 2\. Pending Callbacks Phase

The **pending callbacks** phase executes callbacks for some system operations that were deferred to the next iteration of the event loop[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=,callbacks%20are%20invoked%20here). This phase is less commonly encountered directly in typical JavaScript code, but it exists to handle certain I/O callbacks that couldn’t be executed in the previous iteration. For example, some TCP or UDP errors, or operations like DNS lookups that may have their callbacks deferred, might be handled here. Essentially, if an I/O operation’s callback was set to execute _after_ the poll phase in the last iteration, it lands in the pending callbacks phase of the new iteration. In practice, you won’t often interact with this phase in user code; it’s mostly an internal mechanism to handle some edge cases and _deferred I/O_. It’s enough to know that it runs _after timers and before poll_, picking up any lingering callbacks that need to run at this point.

### 3\. Idle/Prepare Phase

The **idle** and **prepare** phases are internal phases used by libuv (the library implementing the event loop) for its own bookkeeping. These phases are not relevant for userland operations — you typically won’t see any direct effect of these phases in your code. They exist to handle internal tasks in between the poll phase. As the official docs note, the idle and prepare phases are “only used internally”[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=,almost%20all), so we won’t dive into them. Just be aware they happen in the sequence (after pending callbacks and before poll) but do not process any of your callbacks.

### 4\. Poll Phase (I/O)

The **poll** phase is the heart of the event loop where **I/O events** are handled. In the poll phase, the event loop will **retrieve new I/O events** from the operating system and execute the corresponding callbacks for nearly all completed operations (with some exceptions like timers, `setImmediate` callbacks, and certain close events which are handled in other phases)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=,socket.on%28%27close%27%2C). This includes callbacks for completed file system operations, network socket data events, completed HTTP requests, etc. In other words, most asynchronous callbacks (other than timers and a few special cases) get invoked during the poll phase.

This phase has a dual behavior:

*   If **there are I/O callbacks ready** (e.g., data has arrived on a socket, a file read is finished, etc.), the poll phase will execute as many of those callbacks as allowed. It will dequeue each ready event one by one and push its callback onto the call stack for execution. After each callback executes, Node will check the microtask queues (we’ll discuss this shortly) and drain them before continuing to the next I/O callback[builder.io](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop#:~:text=3,nextTick%20queue%2C%20and%20then%20tasks).
    
*   If **there are no I/O events to process**, the poll phase can cause the event loop to **block and wait** for new events. This is where Node can efficiently sleep when idle, handing control to the OS to wait for events (like incoming network data or a completed disk operation). How long will it wait? Potentially indefinitely, but with two important exceptions:
    
    1.  If there are any timers scheduled, the poll phase will only block up to the **timeout of the next due timer**. The loop will wake early to service the timer when its threshold is reached[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=operation%20is%20completed%20is%3A)[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=This%20exception%20ensures%20that%20the,timer%E2%80%99s%20callback%20in%20good%20time).
        
    2.  If a callback has been scheduled via `setImmediate()`, and the poll phase becomes idle (no pending I/O events), the poll phase will end **immediately** even if the timer threshold hasn’t been reached, so that the loop can continue to the **check phase** and execute the `setImmediate` callback without unnecessary delay[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=EXCEPTION%202%20%E2%80%94%20CHECK%20PHASE%3A)[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=In%20essence%2C%20the%20event%20loop,Let%E2%80%99s%20take%20a%20look).
        

In summary, the poll phase is where Node spends most of its time, either processing I/O callbacks or waiting for I/O. It’s the phase that ties into the OS’s event notification (like epoll on Linux, IOCP on Windows, kqueue on macOS). When an asynchronous operation (like `fs.readFile`) finishes in the background (either via OS or thread pool), the result is queued to be handled in this poll phase as a callback on the main thread[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=When%20an%20async%20method%2C%20like,to%20one%20of%202%20places)[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=What%20happens%20after%20the%20event,an%20async%20operation%20for%20processing).

### 5\. Check Phase (`setImmediate`)

The **check** phase is the penultimate phase, and it’s dedicated to executing callbacks scheduled by **`setImmediate()`**. `setImmediate(fn)` is a special Node API that schedules `fn` to run _after the poll phase completes_ on the current loop iteration. When the event loop reaches this phase, it will call all pending `setImmediate` callbacks in a FIFO order[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=,socket.on%28%27close%27%2C). This phase exists because `setImmediate` is designed as a counterpart to `setTimeout(fn, 0)` that runs **slightly later**, making it useful for breaking up long operations and executing code right after the poll events.

One important aspect of the check phase is how it interacts with the poll phase. As noted above, if the poll phase is idle and there are `setImmediate` callbacks waiting, Node will **short-circuit** the poll phase and proceed to the check phase without delay[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=EXCEPTION%202%20%E2%80%94%20CHECK%20PHASE%3A). This ensures `setImmediate` callbacks run as soon as possible when the system is otherwise idle. In typical scenarios, `setImmediate` and `setTimeout(..., 0)` are very similar – both schedule a callback on the next tick of the event loop – but their **ordering can differ** depending on the context. For example, when invoked from the top-level script, a 0ms timeout may happen before or after a `setImmediate` based on platform and implementation details (they _both_ run in the next iteration, but which one queues first can vary)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20function%20passed%20to%20,setImmediate). However, when called from **inside an I/O callback** (i.e., within the poll phase of an iteration), a `setImmediate` will execute _before_ any timers scheduled for the next iteration. This is because the `setImmediate` goes into the check phase of the _current_ iteration (right after poll), whereas the `setTimeout` callback would not execute until the timers phase of the _following_ iteration. Understanding this nuance helps in scenarios where execution order matters. (In short: **top-level**: timers vs immediates are unpredictable in order[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20function%20passed%20to%20,setImmediate), **inside I/O**: `setImmediate` will fire sooner than a new timer.)

### 6\. Close Callbacks Phase

Finally, the **close callbacks** phase handles any callbacks for things that have been closed. For example, if you have a TCP socket or a server and you call `.close()` on it (or it is closed by the other end), the `'close'` event callback fires in this phase[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=,socket.on%28%27close%27%2C). Another example is `process.on('exit')` or certain cleanup operations. In general, **close callbacks** are those registered to cleanup resources when an object is closed (e.g. `socket.on('close', ...)`). This phase runs last in the cycle. Node will execute all queued close callbacks, then proceed to check if it should stop. After the close phase, the event loop iteration ends. Node then **performs a check**: if there are no more pending timers, I/O, or scheduled tasks, it will exit; otherwise, it will start a new event loop tick back at the timers phase[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=Between%20each%20run%20of%20the,if%20there%20are%20not%20any).

It’s worth noting that the close phase is only for certain events; many `'close'` events on streams or sockets are handled in other phases if they are emitted as part of normal operation. But if a socket or handle is closed abruptly or needs a special callback, they will appear here.

### Microtask Processing Between Phases

Crucial to Node’s execution model (especially in modern versions, Node 11+) is the handling of **microtasks** (like resolved Promises and `process.nextTick` callbacks) _in between_ these phases. While not a “phase” on the above diagram, the microtask queues are continuously checked and drained at strategic points. In Node.js (as in browsers), **microtasks have a higher priority** than the next macrotask: after executing a callback from one of the phases above, Node will run any pending microtask callbacks before moving on. This means the event loop often pauses between phases (and even between individual callbacks in a long queue) to clear the microtask queue. We will explain this in detail in the next section, as it’s critical for understanding execution order. For now, keep in mind that the numbered phases we listed are _macrotask_ queues, and microtasks run in-between them to maintain correct ordering.

In summary, an event loop tick goes through: **Timers → Pending → Idle/Prepare → Poll → Check → Close**, with microtasks processed at the beginning and end of each tick and between each callback. If after one full cycle there are still events to process (or new ones were added), the loop continues onto the next tick; if not, the process can exit[builder.io](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop#:~:text=9,tasks%20in%20the%20promise%20queue).

Microtasks vs. Macrotasks in Node.js
------------------------------------

When discussing the event loop, we distinguish between **macrotasks** (regular tasks tied to the phases we described) and **microtasks** (smaller tasks that run immediately after the current operation). In Node.js, understanding this distinction is vital because it determines the **order in which asynchronous callbacks execute**.

*   **Macrotasks** (also just called “tasks” or “callbacks” in Node docs) are scheduled in the event loop phases (timers, poll, check, etc.). Each callback that comes through these phases (a timer firing, an I/O completion event, a `setImmediate` callback, etc.) is a macrotask. They are handled one at a time per phase, and each may spawn more tasks.
    
*   **Microtasks** are a separate queue of high-priority tasks that need to run _before the next macrotask_ is executed. In Node, microtasks primarily include **Promise callbacks** (the `.then()/catch()` handlers) and **`process.nextTick` callbacks**. (In browsers, `queueMicrotask` and mutation observer callbacks are also microtasks; Node also supports `queueMicrotask()` which behaves like a resolved Promise handler.) Microtasks are intended to run _as soon as possible_ after the current code completes, essentially to clean up or continue some work before yielding control back to the event loop.
    

**How Node handles microtasks:** In Node.js (as of Node 11 and above, including Node 20), the event loop will process microtasks at multiple points during each iteration. Specifically, Node’s loop checks microtasks: **(a)** right after running a callback (before returning to any other pending macrotasks), and **(b)** at the end of each phase, and also **(c)** at the very end of one full turn of the event loop (just before starting the next tick)[builder.io](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop#:~:text=1,nextTickQueue%20and%20then%20Promise%20queue)[builder.io](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop#:~:text=6,tasks%20in%20the%20promise%20queue). This behavior was updated in Node 11 to closely match browser behavior, ensuring that microtask queues don’t starve the event loop and are emptied regularly between macrotasks[nairihar.medium.com](https://nairihar.medium.com/you-dont-know-node-js-eventloop-8ee16831767#:~:text=The%20release%20of%20Node,JavaScript%20code%20across%20both%20environments)[nairihar.medium.com](https://nairihar.medium.com/you-dont-know-node-js-eventloop-8ee16831767#:~:text=nextTick%20callbacks%20and%20microtasks%20to,of%20JavaScript%20code%20across%20both).

In practical terms, this means: whenever a Promise is resolved or `process.nextTick` is called, the callback doesn’t go into one of the six macrotask queues, but into a **microtask queue**. Node actually maintains two such microtask queues:

*   The **`process.nextTick` queue**, which is technically _not_ part of the event loop phases at all – it’s a Node-specific mechanism.
    
*   The **“Promises” microtask queue**, used for resolved Promise handlers (and other V8 microtasks).
    

Node prioritizes these microtasks above the normal phases. When the current JavaScript stack unwinds (be it after finishing a synchronous function or after executing one callback from a phase), Node will first run all pending `process.nextTick` callbacks, then run all pending Promise callbacks, before proceeding. In fact, **in each iteration of the event loop, tasks in `process.nextTick` queue run to completion first, then Promise microtasks, and only then does the event loop move on to the next macrotask**[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20,macrotask%20queue)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20function%20passed%20to%20,setImmediate). This is summarized by Node’s docs as: _“A `process.nextTick` callback is added to the nextTick queue. A `Promise.then()` callback is added to the promises microtask queue. A `setTimeout` or `setImmediate` callback is added to the macrotask queue. The event loop will execute all tasks in the nextTick queue first, then the promises microtask queue, and then finally start on the macrotask queue.”_[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20,macrotask%20queue).

Let’s break down the two main types of microtasks in Node:

*   **`process.nextTick()`** – This function defers the execution of a callback function until _after the current operation_ completes, but _before_ the event loop moves on to the next phase[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=You%20may%20have%20noticed%20that,that%20needs%20to%20be%20executed). It’s often used to schedule a callback to run “immediately” after the current function, similar to `setImmediate` but with even higher priority. For example, one might use `process.nextTick` to avoid starvation or to ensure a certain ordering (like deferring an error handling callback until after a function’s main body executes, even if that function completes synchronously). Node treats `nextTick` callbacks in a special queue that will **always drain entirely before the event loop is allowed to continue**[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=Looking%20back%20at%20our%20diagram%2C,from%20reaching%20the%20poll%20phase). This can be dangerous if overused: since `process.nextTick` callbacks run before any I/O or timer, one could recursively queue `nextTick` calls and **starve** the event loop from proceeding to I/O phases[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=Looking%20back%20at%20our%20diagram%2C,from%20reaching%20the%20poll%20phase)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=event%20loop%20continues,from%20reaching%20the%20poll%20phase) (preventing timers or I/O from ever happening). Thus, `process.nextTick` should be used judiciously. It is not part of the standard JavaScript microtask mechanism; it’s a Node-specific extension that effectively runs _ahead_ of other microtasks. In fact, as noted in Node’s documentation, `process.nextTick()` is not depicted in the event loop diagram because it’s handled _outside_ the normal phases – it simply runs immediately after the current JS stack empties, no matter what phase we’re in[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=You%20may%20have%20noticed%20that,that%20needs%20to%20be%20executed).
    
*   **Promise Microtasks** – These are callbacks attached via `Promise.resolve().then(...)` or `await` (which under the hood uses promises), as well as other V8 microtasks. When a Promise is resolved or rejected, its `.then` or `.catch` handlers are queued into the **promises microtask queue**. Node will execute these as soon as the current synchronous code is done, or between macrotasks. Compared to `process.nextTick`, Promise callbacks are slightly lower priority (Node always empties the nextTick queue first)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20,macrotask%20queue). But they still run before any new I/O or timer callbacks. This means if you resolve a promise inside a timer callback, that promise’s `.then` will execute _before_ any other macrotask (like another timer or I/O event) that was ready at the same time. All pending microtasks are executed **to completion** each time Node yields back to the event loop. This can also be a source of blocking if overdone – e.g., scheduling a large number of microtasks in a loop can freeze the program until they all finish, since the event loop will not move on until the microtask queue is empty[nairihar.medium.com](https://nairihar.medium.com/you-dont-know-node-js-eventloop-8ee16831767#:~:text=Similarly%2C%20the%20same%20scenario%20will,or%20executing%20any%20other%20tasks)[nairihar.medium.com](https://nairihar.medium.com/you-dont-know-node-js-eventloop-8ee16831767#:~:text=The%20EventLoop%20will%20be%20continuously,or%20executing%20any%20other%20tasks). Both `process.nextTick` and Promise microtasks can thus cause delays for macrotasks if misused, but they are indispensable for things like resolving asynchronous operations in a predictable order.
    

**Macrotasks**, by contrast, include all the events that go through the six phases we detailed: timer callbacks, I/O events, `setImmediate` callbacks, close events, `setInterval` repeated callbacks, etc. Each macrotask is typically a larger chunk of work. The rule of thumb is: after one macrotask runs (e.g., a timer’s callback), Node will check and run all microtasks before proceeding to either the next callback in that phase’s queue or to the next phase[builder.io](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop#:~:text=3,nextTick%20queue%2C%20and%20then%20tasks)[builder.io](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop#:~:text=5,the%20microtask%20queues%20are%20executed). This guarantees that microtasks (which often are scheduled as follow-ups to the work just done) execute _asap_ and before any unrelated I/O or timer that might be queued.

To illustrate microtasks vs macrotasks in Node, consider this simplified scenario:

```js
console.log('start');
setTimeout(() => {
  console.log('timeout callback');
}, 0);
Promise.resolve().then(() => {
  console.log('promise then callback');
});
process.nextTick(() => {
  console.log('nextTick callback');
});
console.log('end');
```

In this snippet:

1.  `'start'` is printed immediately (synchronous).
    
2.  `setTimeout(..., 0)` schedules a macrotask for the timers phase of the next tick.
    
3.  `Promise.resolve().then(...)` schedules a microtask (promise callback).
    
4.  `process.nextTick(...)` schedules a nextTick microtask.
    
5.  `'end'` is printed (end of synchronous code).
    

Now the call stack is empty, so Node begins to process microtasks before moving to the next tick of the event loop. It will first run all `process.nextTick` callbacks – printing **`nextTick callback`** – then run all Promise callbacks – printing **`promise then callback`**[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20,macrotask%20queue). Only after clearing those microtask queues does the event loop proceed to the **timers phase** of the next tick, where the `setTimeout` callback is now ready to execute, printing **`timeout callback`**. The expected order in Node (CommonJS script) would thus be:

```
start  
end  
nextTick callback  
promise then callback  
timeout callback
```

This demonstrates that microtasks (`nextTick` and promise handlers) execute _before_ the timer, even though the timer was scheduled with a 0ms delay. If we had also used `setImmediate` in the mix, that would queue a macrotask in the check phase, which in this scenario would execute after the timer (because the timer is handled in the earlier phase). Keep in mind that in top-level code, the exact ordering between `setTimeout(…,0)` and `setImmediate` can vary, but both will always happen _after_ the microtasks are drained[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20function%20passed%20to%20,setImmediate).

**Important changes in Node 11+:** Prior to Node.js v11, the event loop would process the microtask queue only at the end of each macrotask (at the end of each event loop tick). Node v11 introduced a change where microtasks are also processed **between** macrotasks, i.e., after every callback yields, not just end-of-tick[nairihar.medium.com](https://nairihar.medium.com/you-dont-know-node-js-eventloop-8ee16831767#:~:text=The%20release%20of%20Node,JavaScript%20code%20across%20both%20environments). This brought Node’s behavior in line with browser JavaScript, preventing scenarios where a long queue of callbacks might delay microtasks for too long. If you worked with older Node versions, you may recall that heavy I/O callback loops could starve promise handlers until the loop became idle. In modern Node, microtasks get a chance to run more frequently, increasing fairness. Another modern twist is that **ESM (ES Modules)** in Node are evaluated asynchronously – the top-level of an ES module runs as a promise, meaning that top-level await is possible and also that microtask timing can differ. In fact, when you run the same code above as an ES module, the output order might change because the whole module’s execution is itself treated as a promise microtask. In Node, if an ES module is loaded, the initial code execution happens in a microtask, which can cause Promise callbacks to be handled slightly differently relative to `process.nextTick` (as we’ll see in an example below)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=The%20principle%20aforementioned%20holds%20true,execution%20order%20will%20be%20different)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=This%20is%20because%20the%20ES,first). We will cover this difference shortly with a concrete example.

Call Stack, Event Loop, and Thread Pool Interaction
---------------------------------------------------

Having described the phases and microtask mechanism, let’s paint a complete picture of how asynchronous tasks flow through Node.js:

*   **The Call Stack:** This is where JavaScript code runs on the main thread. Only one function executes at a time. When you call a function, it’s pushed onto the stack; when it returns, it’s popped off. Synchronous code (like calculations, loops, `console.log` statements) runs here to completion, blocking the event loop while it executes. If the call stack is busy (e.g., an infinite loop or a long computation), the event loop cannot continue – no other events can be processed, causing the program to appear frozen. That’s why CPU-intensive tasks should be offloaded or broken into smaller pieces if possible to keep the event loop responsive.
    
*   **Offloading to the Kernel or Thread Pool:** When an asynchronous operation is initiated (say, `fs.readFile()` or an HTTP request), Node utilizes either the operating system’s async capabilities or the libuv **thread pool** to handle it off the main thread[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=1,handled%20in%20the%20thread%20pool)[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=read%2C%20a%20timer%20has%20timed,out%20etc). For operations like networking (TCP/HTTP) or timers, Node often relies on the OS kernel’s efficient event notification (since modern OSes can handle multiple sockets or timers in background threads). For file system operations, compression, or crypto, Node uses a thread pool (because many OS file APIs are blocking). The default thread pool has 4 threads (configurable via `UV_THREADPOOL_SIZE`). When you call, for example, `fs.readFile('data.txt', callback)`, Node will dispatch that work to a worker thread in the pool. That thread will perform the file I/O, while your main thread can continue running other JavaScript.
    
*   **Asynchronous Completion and Queueing:** When the background work completes (OS signals that data is ready, or the thread pool has finished reading the file, etc.), the result (and any error) needs to be passed back to your code. This is where the **event loop** comes in. The finished operation will queue a callback into the appropriate phase of the event loop. For example, the `fs.readFile` callback will be queued into the poll phase (as it’s an I/O callback). A completed `setTimeout` goes into the timers queue. A resolved DNS query (which uses the thread pool if using `dns.lookup()`, or OS otherwise) would also queue in the poll phase or pending callbacks phase depending on how libuv classified it. Once queued, these callbacks wait until the event loop reaches that phase and executes them. Crucially, the callback doesn’t execute immediately when the background thread finishes – it executes _only when the event loop gets to it_. This is why the main thread isn’t blocked waiting for it; the main thread is free to do other work or handle other events in the interim.
    
*   **Event Loop picks up the task:** As described in the phases, when the loop reaches the right phase, it will take the callback and call it (pushing it onto the call stack to execute). For example, once our `fs.readFile` finishes in the thread pool, its callback will be called during the poll phase on the main thread. At that point, the callback (which likely processes the file data) runs like any other function on the call stack. While that callback is running, no other events can be processed (the event loop is essentially busy). If that callback itself makes further async calls or schedules timers, those go into their respective queues.
    
*   **Microtask and nextTick Interactions:** Often inside a callback, you might schedule microtasks. For instance, inside a `fs.readFile` callback, you might resolve a Promise or call `process.nextTick` for some follow-up action. According to Node’s rules, if you do that, those microtasks will execute _before_ any other event loop tasks are processed. In fact, if your callback queues multiple microtasks, Node will run all of them immediately after the callback completes, before moving on. This ensures that things like promise chains execute in the expected order. For example, if you `resolve` a Promise in a timer callback, the `.then` handler of that Promise will fire right after the timer callback finishes (still in the same tick) – before any other timer or I/O events that are waiting. This interplay between the call stack, event loop, and microtask queue is what allows Node to maintain correct sequencing of events.
    
*   **Returning to the Event Loop:** After a callback completes and all its ensuing microtasks are handled, the call stack is empty again, and Node will continue the loop. If the callback was one of many in that phase’s queue (say, many timers all due at once), the loop will then pick the next callback in the timers queue and execute it. If the phase is done (queue empty or limit hit), Node moves to the next phase, but first checks microtasks again (end-of-phase microtask drain). This cycle continues.
    
*   **Thread Pool vs Event Loop CPU usage:** It's worth highlighting that while the thread pool can handle multiple operations in parallel (up to 4 by default, e.g., reading 4 files at once), the event loop still processes the callbacks one by one. So, if 4 file reads finish at nearly the same time, Node will queue 4 callbacks; the event loop will execute them one after another (with microtasks in between if any). They don't run truly concurrently on the single main thread. Thus, Node achieves concurrency by doing I/O in parallel (thread pool or OS) but still handles the completion callbacks serially. This is usually fine because those callbacks are often quick, but if one callback is slow (CPU-bound), it delays the others – another reason to keep callback code efficient or offload heavy CPU work to worker threads (Node’s Worker Threads or additional processes).
    

In essence, the call stack is where code runs, the event loop is the orchestrator deciding _what_ to run next, and the thread pool/kernel provides the ability to _wait_ for async operations without blocking the main thread. The following sequence is a mental model you can use:

1.  **Main script starts** – call stack runs top-level code. Asynchronous calls are dispatched to kernel or thread pool.
    
2.  **Main script ends** – event loop starts ticking.
    
3.  **Check timers** – execute due timer callbacks (macrotasks), each runs to completion and yields.
    
4.  **Check pending I/O callbacks** – execute any deferred I/O callbacks.
    
5.  **Poll for I/O events** – wait for I/O, execute I/O callbacks as they come.
    
6.  **Process setImmediate** – execute any `setImmediate` callbacks.
    
7.  **Handle close events** – execute close callbacks.
    
8.  **Microtasks** – at each step above (and sub-step), run any `process.nextTick` and promise callbacks that were queued.
    
9.  **Repeat** – loop again if any tasks remain.
    

Throughout this, remember that **`process.nextTick`** is so high priority that it will execute _before_ the event loop continues even to the next phase[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=You%20may%20have%20noticed%20that,that%20needs%20to%20be%20executed)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=Looking%20back%20at%20our%20diagram%2C,from%20reaching%20the%20poll%20phase). It effectively inserts your callback at the head of the event loop cycle.

Code Examples: Execution Order Explained
----------------------------------------

Let’s apply all of this theory to concrete examples. We will analyze some code snippets and determine the order of output, explaining why each piece runs when it does. These examples are annotated step-by-step:

### Example 1: Timers vs Immediate vs Microtasks

```js
console.log('start');
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('end');
```

**Predicting the output order:**

1.  **Synchronous phase:** The calls to `console.log('start')` and `console.log('end')` execute immediately, in order. So the first output will be `start`, then `end` – these come from the main call stack running top-level code. At the same time:
    
    *   `setTimeout(..., 0)` schedules a callback in the **timers** phase of the next event loop tick. It will _not_ execute now, just queued.
        
    *   `setImmediate(...)` schedules a callback in the **check** phase of the next tick.
        
    *   `Promise.resolve().then(...)` schedules a **microtask** to print `promise` (in the promises microtask queue).
        
    *   `process.nextTick(...)` schedules a **microtask** to print `nextTick` (in the nextTick queue).
        
2.  **After the synchronous code finishes:** The call stack is now empty (the script’s last statement was `console.log('end')`). Node will not yet start a new event loop iteration; it first processes the microtask queues. According to Node’s rules, it will run all `process.nextTick` callbacks first, then all Promise callbacks[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20,macrotask%20queue). So:
    
    *   The `nextTick` callback runs, printing `nextTick`. (At this point, we have output: `start`, `end`, `nextTick`.)
        
    *   Next, the Promise’s `.then` callback runs, printing `promise`. (Output now: `start`, `end`, `nextTick`, `promise`.)
        
    *   If either of those microtasks queued additional microtasks (they did not in this case), those would also execute now, before proceeding.
        
3.  **Event loop tick – timers phase:** Now Node moves into the event loop’s next iteration. **Timers phase** runs and finds the `setTimeout` callback due (0ms has elapsed). It executes the timeout callback, printing `timeout`. (Output: ... `promise`, `timeout`.)
    
    *   After executing the timeout callback, Node again checks the microtask queues. In our snippet, the timeout’s callback didn’t queue any microtasks, so nothing new here. If it had (e.g., if inside the timeout we did `process.nextTick` or resolved a Promise), those would run right now _before continuing_.
        
4.  **Pending callbacks phase:** (Likely nothing in this example, so skip.)
    
5.  **Poll phase:** No I/O in this example, and perhaps no events to poll, so it might idle briefly. However, we _do_ have a scheduled `setImmediate`, and an empty poll queue will cause the loop to skip directly to the check phase (per the rule that if poll is idle and a check callback is waiting, don’t block).
    
6.  **Check phase:** The `setImmediate` callback now executes, printing `immediate`. (Final output: `start, end, nextTick, promise, timeout, immediate`.)
    
    *   After this, microtasks would be processed again, but none were queued inside the immediate callback.
        

So the expected output order is: **start → end → nextTick → promise → timeout → immediate**. Let’s verify reasoning with authoritative explanation: According to Node’s documentation, in a common scenario, `process.nextTick` fires first, then promise callbacks, then on the next loop tick timers and immediates will run in an order that depends on context (here, timer happened to fire before immediate)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20function%20passed%20to%20,setImmediate)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20,macrotask%20queue). Our reasoning matches this: `nextTick` and `promise` ran before any macrotask; the 0ms timeout ran in the timers phase; the setImmediate ran afterwards in the check phase.

**Note:** If this code is executed as a CommonJS script via `node example.js`, we get the order above. If instead this code were within an ES Module, the top-level execution is itself asynchronous. In Node’s ESM, the top-level await or promise handling can change the ordering such that the promise might actually resolve _before_ the nextTick. In fact, Node.js documentation points out that in ES module context, the output could be `start, bar, foo, zoo, baz` for a similar example, whereas in CommonJS it was `start, foo, bar, zoo, baz`[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=The%20principle%20aforementioned%20holds%20true,execution%20order%20will%20be%20different)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=%2F%2F%20start%20bar%20foo%20zoo,baz). In our case, it could mean that `'promise'` might appear before `'nextTick'` in an ES module. The reason is that the entire module is evaluated as a promise (microtask), so by the time our code runs, we might already be in a microtask context where promise callbacks get handled slightly differently. The key takeaway is: **CommonJS** (standard Node scripts) execute synchronously for top-level code, whereas **ESM** top-level code runs asynchronously (essentially scheduled as a microtask). This is an advanced nuance, but important if you see differences in ordering when using `import` vs `require`. For consistency in these examples, we assume CommonJS execution, as that’s the traditional Node behavior.

### Example 2: I/O Callbacks and Microtasks

Now, consider a scenario involving I/O. Suppose we have:

```js
const fs = require('fs');
fs.readFile('example.txt', () => {
  console.log('file read callback');
  setImmediate(() => console.log('inner immediate'));
  setTimeout(() => console.log('inner timeout'), 0);
  process.nextTick(() => console.log('inner nextTick'));
  Promise.resolve().then(() => console.log('inner promise'));
});
console.log('outside');
```

Assume `example.txt` is a small file, so the read completes quickly. Here’s the breakdown:

*   We call `fs.readFile(..., callback)`. This initiates an async file read. Node offloads the operation to the thread pool (because file I/O is handled by libuv threads)[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=http%2Fhttps%2C%20tls%2C%20stdin%2Fout%2Ferror%20etc,handled%20in%20the%20thread%20pool). The main thread doesn’t wait for it; execution continues.
    
*   We `console.log('outside')` immediately, since reading the file is async. So `outside` is printed first.
    
*   The main script ends, now the event loop will wait for events. The file read in the background thread finishes at some point (let’s assume almost immediately for this thought experiment). When it finishes, its callback (`file read callback`) is queued. File I/O callbacks are handled in the **poll** phase.
    
*   Event loop tick: Timers phase – none due (we didn’t have a timer yet, the `setTimeout` inside callback hasn’t been scheduled at this point).
    
*   Pending callbacks – none.
    
*   Idle/prepare – nothing.
    
*   **Poll phase:** The readFile operation is done, so its callback is now dequeued and executed. We enter the callback:
    
    *   It prints `file read callback`.
        
    *   Schedules a `setImmediate` (to print `inner immediate`) for the check phase.
        
    *   Schedules a `setTimeout` (to print `inner timeout`) for the next timers phase.
        
    *   Schedules a `process.nextTick` (to print `inner nextTick`).
        
    *   Schedules a `Promise.resolve().then` (to print `inner promise`).
        
*   The `readFile` callback function ends. Now, before moving on, Node checks the microtask queues _right after this poll callback_. We have two microtasks from inside it:
    
    *   The `process.nextTick` from inside runs first, printing `inner nextTick`.
        
    *   Then the promise’s `.then` runs, printing `inner promise`[reddit.com](https://www.reddit.com/r/node/comments/16zbbsf/where_does_the_event_loop_live_in_nodejs_runtime/#:~:text=Event%20loop%20executes%20tasks%20in,and%20then%20executes%20macrotask%20queue)[reddit.com](https://www.reddit.com/r/node/comments/16zbbsf/where_does_the_event_loop_live_in_nodejs_runtime/#:~:text=control%20is%20returned%20to%20check,all%20pending%20microtasks%20are%20executed).
        
    *   (These microtasks are executed immediately after the I/O callback, **before** any other event loop work.)
        
*   The poll phase would normally continue to any other I/O events, but we assume none left for now. Poll phase completes.
    
*   **Check phase:** Now the loop moves to check phase. We have the `inner immediate` scheduled, so it executes and prints `inner immediate`.
    
    *   After that callback, any microtasks it created would run (none in this case).
        
*   **Close phase:** none here.
    
*   End of tick: Now the first loop iteration is done. The only remaining scheduled task is the `inner timeout` (the `setTimeout(…,0)` from inside the file callback). Because we’ve completed one loop, we start the next:
    
    *   **Timers phase (next iteration):** The 0ms timer is due now, so it runs and prints `inner timeout`.
        
    *   Check microtasks after it (none).
        
    *   No other timers, then pending, etc... eventually loop would exit if nothing else.
        

The output sequence should be:

```
outside  
file read callback  
inner nextTick  
inner promise  
inner immediate  
inner timeout
```

In that order. Let’s double-check the logic with what we know: `outside` comes first (synchronous). The file read callback comes later (async result). Within that callback, nextTick and promise microtasks are scheduled and thus run _before_ the `setImmediate` and `setTimeout` that were also scheduled. The `setImmediate` runs later that iteration (check phase), and the `setTimeout` runs in the following tick (timers phase). This matches our output ordering.

The key point from Example 2 is demonstrating how even inside an I/O callback, microtasks execute as soon as that callback is done, before allowing other queued events (like timers or immediates) to proceed. This is how Node ensures that promise chains don’t lag behind I/O events, and how `process.nextTick` can be used to adjust ordering of events within the same tick.

### Example 3: Chaining `process.nextTick` (cautionary tale)

One more quick example to illustrate how `process.nextTick` can starve the loop if misused:

```js
let count = 0;
function schedule() {
  if (++count > 5) return;
  process.nextTick(schedule);
  console.log('Tick', count);
}
schedule();
```

Here, we call `schedule()`, which increments a counter and uses `process.nextTick` to recursively schedule itself if count <= 5. What happens is that the first call to `schedule()` is synchronous (count becomes 1, schedules a nextTick, prints "Tick 1"). When it returns, the main stack is done, and now the event loop will process the `nextTick` queue. That scheduled `schedule` call runs (count 2, schedules another nextTick, prints "Tick 2"), and this repeats. Essentially, all 5 calls happen before the event loop ever gets to process any timers or I/O. If we had set a `setTimeout(..., 0)` before calling `schedule()`, that timeout’s callback would only run **after** these five nextTick iterations complete, even though no actual time was spent waiting. This shows how `process.nextTick` can be used to do quick loops without yielding – but if you mistakenly queue hundreds of nextTicks, you could block the event loop for a while (potentially causing latency for I/O). Always consider if a normal `setImmediate` or resolved Promise might suffice, as those yield back to the loop more readily.

Tracing Execution Flow in Complex Async Code
--------------------------------------------

Understanding the event loop’s phases and the priority of microtasks gives you a mental model to **trace execution flow** in Node.js applications. Here are some tips to determine what runs first, especially in complex asynchronous operations:

*   **Annotate with Logs:** As we did in the examples, liberally insert `console.log` (or use a debugger) to label different steps of your code. Logging statements like “start of timer callback” or “promise then executed” can reveal the actual order when you run the program. Because of the deterministic event loop semantics, you can often predict the order, but logging provides confirmation.
    
*   **Break Down by Event Loop Tick:** Separate what happens in the _current_ tick versus the _next_ tick. Synchronous code and any microtasks will always complete in the current tick. Macrotasks (timers, I/O, immediates) will happen in future ticks. For each async call you encounter, ask: “Is this a microtask or a macrotask? And if a macrotask, in which phase will its callback run?” Mark it accordingly. For example, reading a file -> poll phase, next tick; `process.nextTick` -> current tick microtask; `setTimeout` -> timers, next tick; `setImmediate` -> check phase, next tick (or same tick if in I/O).
    
*   **Microtask vs Macrotask priority:** Always remember that any Promise resolution or `process.nextTick` that occurs will effectively interject itself before the next macrotask. So if you see code scheduling both, you can predict that all the `nextTick` stuff fires first, then promise callbacks, then the rest[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20,macrotask%20queue). This helps in tracing, for instance, an async function (`async/await`): an awaited operation returns a promise, whose resolution might queue microtasks that will fire before subsequent lines in your current function (since those subsequent lines actually become a promise continuation themselves).
    
*   **Use Tools if needed:** Node.js has debugging and profiling tools (like the Chrome DevTools inspector or `async_hooks` module) that can help trace asynchronous operations. For example, `async_hooks` can let you track lifecycle of async resources (when they’re created and when their callbacks execute). This is advanced, but for very complex flows it can be illuminating. Additionally, Node’s `--trace-events` and `--trace-sync-io` flags can provide low-level insights. However, for most cases, reasoning with the model and some strategic logging is sufficient.
    
*   **Identify Phases by API:** If you’re unsure which phase a callback goes to, refer to documentation:
    
    *   Timers: `setTimeout`, `setInterval` -> Timers phase.
        
    *   Immediates: `setImmediate` -> Check phase.
        
    *   I/O: most callbacks from network, disk, etc. -> Poll phase (unless otherwise noted).
        
    *   Close: e.g. `socket.on('close')` after a stream ends or `ws.on('close')` -> Close phase.
        
    *   `nextTick` -> microtask (runs ASAP, before any of above).
        
    *   Promises/`await` -> microtask (ASAP after current code).
        
*   **Complex async flows:** In scenarios like multiple nested async calls (callbacks within callbacks), approach stepwise. For instance, an HTTP server handling a request might do some DB query (async), then in its callback set a timer, then in that timer’s callback send a response. Laying this out: request event (poll phase) -> DB query dispatched -> response callback in poll phase later -> inside that, schedule timer -> timer fires next tick -> send response. If multiple clients, these interleave, but each follows the same loop rules. Visualizing a timeline with ticks can help.
    

By systematically following these rules and knowing the priorities, you can trace **even complex interleavings** of events. For example, if something isn’t executing when you expect, check if a microtask is running first and perhaps blocking (e.g., a large number of promise `.then` handlers executing back-to-back could delay a timer). Or if two timers seem out of order, recall that timers scheduled within an I/O callback won’t execute until _at least_ the next tick, whereas a `setImmediate` inside an I/O callback will execute _before_ those timers.

In modern Node (v20+), the behavior is stable and in line with this description. One big difference from older Node versions (pre-11) we highlighted is the microtask handling frequency[nairihar.medium.com](https://nairihar.medium.com/you-dont-know-node-js-eventloop-8ee16831767#:~:text=The%20release%20of%20Node,JavaScript%20code%20across%20both%20environments), but since you’re using Node 20, you get the benefit of those improvements. Another difference is ESM vs CommonJS execution order quirks, which we touched on – just be mindful when reading tutorials or older code, if something uses ES modules, the top-level code runs asynchronously, which can shuffle the order of `nextTick` vs immediate promise resolutions[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=The%20principle%20aforementioned%20holds%20true,execution%20order%20will%20be%20different)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=This%20is%20because%20the%20ES,first). The fundamental event loop phases remain the same.

Conclusion
----------

The Node.js event loop orchestrates a symphony of tasks – timers, I/O events, immediates, closures – all on a single thread, giving the illusion of parallelism while maintaining deterministic execution order. By understanding each phase of the loop and the crucial role of microtasks (`process.nextTick` and Promises), you can **reconstruct the execution flow** of virtually any Node.js program. We saw that each phase has a clear purpose: timers for scheduled code, poll for I/O, check for immediates, etc., and between every phase and callback, microtasks ensure that short, quick tasks are handled without delay. The libuv thread pool and OS integrations allow Node to perform heavy lifting and wait for I/O on other threads, keeping the main thread free to run JavaScript callbacks as events arrive[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=1,handled%20in%20the%20thread%20pool)[medium.com](https://medium.com/@adinlewakoyejo/under-the-libuv-hood-how-the-node-js-event-loop-works-158347ec2261#:~:text=read%2C%20a%20timer%20has%20timed,out%20etc).

With this deep dive, you have essentially “relearned” Node’s asynchronous model: you can now predict when a `setTimeout` will fire relative to a `Promise.then`, or why a `process.nextTick` inside a callback executes _before_ the event loop moves on. You can trace complex async operations by breaking them into phases and ticks, ensuring no surprises. As a final piece of advice: always be cautious about blocking the event loop (synchronous loops or too many microtasks) – Node can handle thousands of concurrent operations, but only if you let the event loop churn. Now that you have a comprehensive understanding, you can write and troubleshoot Node.js code with confidence about “what runs when,” from Node 20 and beyond, even as the platform continues to evolve. Enjoy your renewed journey into Node.js, armed with the knowledge of its event loop internals!

**Sources:** Node.js official documentation on the event loop[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=,callbacks%20are%20invoked%20here)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#:~:text=You%20may%20have%20noticed%20that,that%20needs%20to%20be%20executed), Node.js guides on `setImmediate` and `process.nextTick`[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20function%20passed%20to%20,setImmediate)[nodejs.org](https://nodejs.org/en/learn/asynchronous-work/understanding-setimmediate#:~:text=A%20,macrotask%20queue), and deep-dive articles on Node’s event loop and microtask queue behavior[builder.io](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop#:~:text=1,nextTickQueue%20and%20then%20Promise%20queue)[builder.io](https://www.builder.io/blog/visual-guide-to-nodejs-event-loop#:~:text=6,tasks%20in%20the%20promise%20queue). These resources provide further examples and diagrams (some of which we referenced) to solidify these concepts. Happy coding with Node.js’s event-driven architecture!


