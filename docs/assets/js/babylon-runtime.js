/*!
 * PEP v0.4.3 | https://github.com/jquery/PEP
 * Copyright jQuery Foundation and other contributors | http://jquery.org/license
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.PointerEventsPolyfill = factory());
}(this, function () {
    'use strict';
    /**
     * This is the constructor for new PointerEvents.
     *
     * New Pointer Events must be given a type, and an optional dictionary of
     * initialization properties.
     *
     * Due to certain platform requirements, events returned from the constructor
     * identify as MouseEvents.
     *
     * @constructor
     * @param {String} inType The type of the event to create.
     * @param {Object} [inDict] An optional dictionary of initial event properties.
     * @return {Event} A new PointerEvent of type `inType`, initialized with properties from `inDict`.
     */
    var MOUSE_PROPS = [
        'bubbles',
        'cancelable',
        'view',
        'detail',
        'screenX',
        'screenY',
        'clientX',
        'clientY',
        'ctrlKey',
        'altKey',
        'shiftKey',
        'metaKey',
        'button',
        'relatedTarget',
        'pageX',
        'pageY'
    ];
    var MOUSE_DEFAULTS = [
        false,
        false,
        null,
        null,
        0,
        0,
        0,
        0,
        false,
        false,
        false,
        false,
        0,
        null,
        0,
        0
    ];
    function PointerEvent(inType, inDict) {
        inDict = inDict || Object.create(null);
        var e = document.createEvent('Event');
        e.initEvent(inType, inDict.bubbles || false, inDict.cancelable || false);
        // define inherited MouseEvent properties
        // skip bubbles and cancelable since they're set above in initEvent()
        for (var i = 2, p; i < MOUSE_PROPS.length; i++) {
            p = MOUSE_PROPS[i];
            e[p] = inDict[p] || MOUSE_DEFAULTS[i];
        }
        e.buttons = inDict.buttons || 0;
        // Spec requires that pointers without pressure specified use 0.5 for down
        // state and 0 for up state.
        var pressure = 0;
        if (inDict.pressure && e.buttons) {
            pressure = inDict.pressure;
        }
        else {
            pressure = e.buttons ? 0.5 : 0;
        }
        // add x/y properties aliased to clientX/Y
        e.x = e.clientX;
        e.y = e.clientY;
        // define the properties of the PointerEvent interface
        e.pointerId = inDict.pointerId || 0;
        e.width = inDict.width || 0;
        e.height = inDict.height || 0;
        e.pressure = pressure;
        e.tiltX = inDict.tiltX || 0;
        e.tiltY = inDict.tiltY || 0;
        e.twist = inDict.twist || 0;
        e.tangentialPressure = inDict.tangentialPressure || 0;
        e.pointerType = inDict.pointerType || '';
        e.hwTimestamp = inDict.hwTimestamp || 0;
        e.isPrimary = inDict.isPrimary || false;
        return e;
    }
    /**
     * This module implements a map of pointer states
     */
    var USE_MAP = window.Map && window.Map.prototype.forEach;
    var PointerMap = USE_MAP ? Map : SparseArrayMap;
    function SparseArrayMap() {
        this.array = [];
        this.size = 0;
    }
    SparseArrayMap.prototype = {
        set: function (k, v) {
            if (v === undefined) {
                return this.delete(k);
            }
            if (!this.has(k)) {
                this.size++;
            }
            this.array[k] = v;
        },
        has: function (k) {
            return this.array[k] !== undefined;
        },
        delete: function (k) {
            if (this.has(k)) {
                delete this.array[k];
                this.size--;
            }
        },
        get: function (k) {
            return this.array[k];
        },
        clear: function () {
            this.array.length = 0;
            this.size = 0;
        },
        // return value, key, map
        forEach: function (callback, thisArg) {
            return this.array.forEach(function (v, k) {
                callback.call(thisArg, v, k, this);
            }, this);
        }
    };
    var CLONE_PROPS = [
        // MouseEvent
        'bubbles',
        'cancelable',
        'view',
        'detail',
        'screenX',
        'screenY',
        'clientX',
        'clientY',
        'ctrlKey',
        'altKey',
        'shiftKey',
        'metaKey',
        'button',
        'relatedTarget',
        // DOM Level 3
        'buttons',
        // PointerEvent
        'pointerId',
        'width',
        'height',
        'pressure',
        'tiltX',
        'tiltY',
        'pointerType',
        'hwTimestamp',
        'isPrimary',
        // event instance
        'type',
        'target',
        'currentTarget',
        'which',
        'pageX',
        'pageY',
        'timeStamp'
    ];
    var CLONE_DEFAULTS = [
        // MouseEvent
        false,
        false,
        null,
        null,
        0,
        0,
        0,
        0,
        false,
        false,
        false,
        false,
        0,
        null,
        // DOM Level 3
        0,
        // PointerEvent
        0,
        0,
        0,
        0,
        0,
        0,
        '',
        0,
        false,
        // event instance
        '',
        null,
        null,
        0,
        0,
        0,
        0
    ];
    var BOUNDARY_EVENTS = {
        'pointerover': 1,
        'pointerout': 1,
        'pointerenter': 1,
        'pointerleave': 1
    };
    var HAS_SVG_INSTANCE = (typeof SVGElementInstance !== 'undefined');
    /**
     * This module is for normalizing events. Mouse and Touch events will be
     * collected here, and fire PointerEvents that have the same semantics, no
     * matter the source.
     * Events fired:
     *   - pointerdown: a pointing is added
     *   - pointerup: a pointer is removed
     *   - pointermove: a pointer is moved
     *   - pointerover: a pointer crosses into an element
     *   - pointerout: a pointer leaves an element
     *   - pointercancel: a pointer will no longer generate events
     */
    var dispatcher = {
        pointermap: new PointerMap(),
        eventMap: Object.create(null),
        captureInfo: Object.create(null),
        // Scope objects for native events.
        // This exists for ease of testing.
        eventSources: Object.create(null),
        eventSourceList: [],
        /**
         * Add a new event source that will generate pointer events.
         *
         * `inSource` must contain an array of event names named `events`, and
         * functions with the names specified in the `events` array.
         * @param {string} name A name for the event source
         * @param {Object} source A new source of platform events.
         */
        registerSource: function (name, source) {
            var s = source;
            var newEvents = s.events;
            if (newEvents) {
                newEvents.forEach(function (e) {
                    if (s[e]) {
                        this.eventMap[e] = s[e].bind(s);
                    }
                }, this);
                this.eventSources[name] = s;
                this.eventSourceList.push(s);
            }
        },
        register: function (element) {
            var l = this.eventSourceList.length;
            for (var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {
                // call eventsource register
                es.register.call(es, element);
            }
        },
        unregister: function (element) {
            var l = this.eventSourceList.length;
            for (var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {
                // call eventsource register
                es.unregister.call(es, element);
            }
        },
        contains: /*scope.external.contains || */ function (container, contained) {
            try {
                return container.contains(contained);
            }
            catch (ex) {
                // most likely: https://bugzilla.mozilla.org/show_bug.cgi?id=208427
                return false;
            }
        },
        // EVENTS
        down: function (inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointerdown', inEvent);
        },
        move: function (inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointermove', inEvent);
        },
        up: function (inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointerup', inEvent);
        },
        enter: function (inEvent) {
            inEvent.bubbles = false;
            this.fireEvent('pointerenter', inEvent);
        },
        leave: function (inEvent) {
            inEvent.bubbles = false;
            this.fireEvent('pointerleave', inEvent);
        },
        over: function (inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointerover', inEvent);
        },
        out: function (inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointerout', inEvent);
        },
        cancel: function (inEvent) {
            inEvent.bubbles = true;
            this.fireEvent('pointercancel', inEvent);
        },
        leaveOut: function (event) {
            this.out(event);
            this.propagate(event, this.leave, false);
        },
        enterOver: function (event) {
            this.over(event);
            this.propagate(event, this.enter, true);
        },
        // LISTENER LOGIC
        eventHandler: function (inEvent) {
            // This is used to prevent multiple dispatch of pointerevents from
            // platform events. This can happen when two elements in different scopes
            // are set up to create pointer events, which is relevant to Shadow DOM.
            if (inEvent._handledByPE) {
                return;
            }
            var type = inEvent.type;
            var fn = this.eventMap && this.eventMap[type];
            if (fn) {
                fn(inEvent);
            }
            inEvent._handledByPE = true;
        },
        // set up event listeners
        listen: function (target, events) {
            events.forEach(function (e) {
                this.addEvent(target, e);
            }, this);
        },
        // remove event listeners
        unlisten: function (target, events) {
            events.forEach(function (e) {
                this.removeEvent(target, e);
            }, this);
        },
        addEvent: /*scope.external.addEvent || */ function (target, eventName) {
            target.addEventListener(eventName, this.boundHandler);
        },
        removeEvent: /*scope.external.removeEvent || */ function (target, eventName) {
            target.removeEventListener(eventName, this.boundHandler);
        },
        // EVENT CREATION AND TRACKING
        /**
         * Creates a new Event of type `inType`, based on the information in
         * `inEvent`.
         *
         * @param {string} inType A string representing the type of event to create
         * @param {Event} inEvent A platform event with a target
         * @return {Event} A PointerEvent of type `inType`
         */
        makeEvent: function (inType, inEvent) {
            // relatedTarget must be null if pointer is captured
            if (this.captureInfo[inEvent.pointerId]) {
                inEvent.relatedTarget = null;
            }
            var e = new PointerEvent(inType, inEvent);
            if (inEvent.preventDefault) {
                e.preventDefault = inEvent.preventDefault;
            }
            e._target = e._target || inEvent.target;
            return e;
        },
        // make and dispatch an event in one call
        fireEvent: function (inType, inEvent) {
            var e = this.makeEvent(inType, inEvent);
            return this.dispatchEvent(e);
        },
        /**
         * Returns a snapshot of inEvent, with writable properties.
         *
         * @param {Event} inEvent An event that contains properties to copy.
         * @return {Object} An object containing shallow copies of `inEvent`'s
         *    properties.
         */
        cloneEvent: function (inEvent) {
            var eventCopy = Object.create(null);
            var p;
            for (var i = 0; i < CLONE_PROPS.length; i++) {
                p = CLONE_PROPS[i];
                eventCopy[p] = inEvent[p] || CLONE_DEFAULTS[i];
                // Work around SVGInstanceElement shadow tree
                // Return the <use> element that is represented by the instance for Safari, Chrome, IE.
                // This is the behavior implemented by Firefox.
                if (HAS_SVG_INSTANCE && (p === 'target' || p === 'relatedTarget')) {
                    if (eventCopy[p] instanceof SVGElementInstance) {
                        eventCopy[p] = eventCopy[p].correspondingUseElement;
                    }
                }
            }
            // keep the semantics of preventDefault
            if (inEvent.preventDefault) {
                eventCopy.preventDefault = function () {
                    inEvent.preventDefault();
                };
            }
            return eventCopy;
        },
        getTarget: function (inEvent) {
            var capture = this.captureInfo[inEvent.pointerId];
            if (!capture) {
                return inEvent._target;
            }
            if (inEvent._target === capture || !(inEvent.type in BOUNDARY_EVENTS)) {
                return capture;
            }
        },
        propagate: function (event, fn, propagateDown) {
            var target = event.target;
            var targets = [];
            // Order of conditions due to document.contains() missing in IE.
            while (target !== document && !target.contains(event.relatedTarget)) {
                targets.push(target);
                target = target.parentNode;
                // Touch: Do not propagate if node is detached.
                if (!target) {
                    return;
                }
            }
            if (propagateDown) {
                targets.reverse();
            }
            targets.forEach(function (target) {
                event.target = target;
                fn.call(this, event);
            }, this);
        },
        setCapture: function (inPointerId, inTarget, skipDispatch) {
            if (this.captureInfo[inPointerId]) {
                this.releaseCapture(inPointerId, skipDispatch);
            }
            this.captureInfo[inPointerId] = inTarget;
            this.implicitRelease = this.releaseCapture.bind(this, inPointerId, skipDispatch);
            document.addEventListener('pointerup', this.implicitRelease);
            document.addEventListener('pointercancel', this.implicitRelease);
            var e = new PointerEvent('gotpointercapture');
            e.pointerId = inPointerId;
            e._target = inTarget;
            if (!skipDispatch) {
                this.asyncDispatchEvent(e);
            }
        },
        releaseCapture: function (inPointerId, skipDispatch) {
            var t = this.captureInfo[inPointerId];
            if (!t) {
                return;
            }
            this.captureInfo[inPointerId] = undefined;
            document.removeEventListener('pointerup', this.implicitRelease);
            document.removeEventListener('pointercancel', this.implicitRelease);
            var e = new PointerEvent('lostpointercapture');
            e.pointerId = inPointerId;
            e._target = t;
            if (!skipDispatch) {
                this.asyncDispatchEvent(e);
            }
        },
        /**
         * Dispatches the event to its target.
         *
         * @param {Event} inEvent The event to be dispatched.
         * @return {Boolean} True if an event handler returns true, false otherwise.
         */
        dispatchEvent: /*scope.external.dispatchEvent || */ function (inEvent) {
            var t = this.getTarget(inEvent);
            if (t) {
                return t.dispatchEvent(inEvent);
            }
        },
        asyncDispatchEvent: function (inEvent) {
            requestAnimationFrame(this.dispatchEvent.bind(this, inEvent));
        }
    };
    dispatcher.boundHandler = dispatcher.eventHandler.bind(dispatcher);
    var targeting = {
        shadow: function (inEl) {
            if (inEl) {
                return inEl.shadowRoot || inEl.webkitShadowRoot;
            }
        },
        canTarget: function (shadow) {
            return shadow && Boolean(shadow.elementFromPoint);
        },
        targetingShadow: function (inEl) {
            var s = this.shadow(inEl);
            if (this.canTarget(s)) {
                return s;
            }
        },
        olderShadow: function (shadow) {
            var os = shadow.olderShadowRoot;
            if (!os) {
                var se = shadow.querySelector('shadow');
                if (se) {
                    os = se.olderShadowRoot;
                }
            }
            return os;
        },
        allShadows: function (element) {
            var shadows = [];
            var s = this.shadow(element);
            while (s) {
                shadows.push(s);
                s = this.olderShadow(s);
            }
            return shadows;
        },
        searchRoot: function (inRoot, x, y) {
            if (inRoot) {
                var t = inRoot.elementFromPoint(x, y);
                var st, sr;
                // is element a shadow host?
                sr = this.targetingShadow(t);
                while (sr) {
                    // find the the element inside the shadow root
                    st = sr.elementFromPoint(x, y);
                    if (!st) {
                        // check for older shadows
                        sr = this.olderShadow(sr);
                    }
                    else {
                        // shadowed element may contain a shadow root
                        var ssr = this.targetingShadow(st);
                        return this.searchRoot(ssr, x, y) || st;
                    }
                }
                // light dom element is the target
                return t;
            }
        },
        owner: function (element) {
            var s = element;
            // walk up until you hit the shadow root or document
            while (s.parentNode) {
                s = s.parentNode;
            }
            // the owner element is expected to be a Document or ShadowRoot
            if (s.nodeType !== Node.DOCUMENT_NODE && s.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
                s = document;
            }
            return s;
        },
        findTarget: function (inEvent) {
            var x = inEvent.clientX;
            var y = inEvent.clientY;
            // if the listener is in the shadow root, it is much faster to start there
            var s = this.owner(inEvent.target);
            // if x, y is not in this root, fall back to document search
            if (!s.elementFromPoint(x, y)) {
                s = document;
            }
            return this.searchRoot(s, x, y);
        }
    };
    var forEach = Array.prototype.forEach.call.bind(Array.prototype.forEach);
    var map = Array.prototype.map.call.bind(Array.prototype.map);
    var toArray = Array.prototype.slice.call.bind(Array.prototype.slice);
    var filter = Array.prototype.filter.call.bind(Array.prototype.filter);
    var MO = window.MutationObserver || window.WebKitMutationObserver;
    var SELECTOR = '[touch-action]';
    var OBSERVER_INIT = {
        subtree: true,
        childList: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['touch-action']
    };
    function Installer(add, remove, changed, binder) {
        this.addCallback = add.bind(binder);
        this.removeCallback = remove.bind(binder);
        this.changedCallback = changed.bind(binder);
        if (MO) {
            this.observer = new MO(this.mutationWatcher.bind(this));
        }
    }
    Installer.prototype = {
        watchSubtree: function (target) {
            // Only watch scopes that can target find, as these are top-level.
            // Otherwise we can see duplicate additions and removals that add noise.
            //
            // TODO(dfreedman): For some instances with ShadowDOMPolyfill, we can see
            // a removal without an insertion when a node is redistributed among
            // shadows. Since it all ends up correct in the document, watching only
            // the document will yield the correct mutations to watch.
            if (this.observer && targeting.canTarget(target)) {
                this.observer.observe(target, OBSERVER_INIT);
            }
        },
        enableOnSubtree: function (target) {
            this.watchSubtree(target);
            if (target === document && document.readyState !== 'complete') {
                this.installOnLoad();
            }
            else {
                this.installNewSubtree(target);
            }
        },
        installNewSubtree: function (target) {
            forEach(this.findElements(target), this.addElement, this);
        },
        findElements: function (target) {
            if (target.querySelectorAll) {
                return target.querySelectorAll(SELECTOR);
            }
            return [];
        },
        removeElement: function (el) {
            this.removeCallback(el);
        },
        addElement: function (el) {
            this.addCallback(el);
        },
        elementChanged: function (el, oldValue) {
            this.changedCallback(el, oldValue);
        },
        concatLists: function (accum, list) {
            return accum.concat(toArray(list));
        },
        // register all touch-action = none nodes on document load
        installOnLoad: function () {
            document.addEventListener('readystatechange', function () {
                if (document.readyState === 'complete') {
                    this.installNewSubtree(document);
                }
            }.bind(this));
        },
        isElement: function (n) {
            return n.nodeType === Node.ELEMENT_NODE;
        },
        flattenMutationTree: function (inNodes) {
            // find children with touch-action
            var tree = map(inNodes, this.findElements, this);
            // make sure the added nodes are accounted for
            tree.push(filter(inNodes, this.isElement));
            // flatten the list
            return tree.reduce(this.concatLists, []);
        },
        mutationWatcher: function (mutations) {
            mutations.forEach(this.mutationHandler, this);
        },
        mutationHandler: function (m) {
            if (m.type === 'childList') {
                var added = this.flattenMutationTree(m.addedNodes);
                added.forEach(this.addElement, this);
                var removed = this.flattenMutationTree(m.removedNodes);
                removed.forEach(this.removeElement, this);
            }
            else if (m.type === 'attributes') {
                this.elementChanged(m.target, m.oldValue);
            }
        }
    };
    function shadowSelector(v) {
        return 'body /shadow-deep/ ' + selector(v);
    }
    function selector(v) {
        return '[touch-action="' + v + '"]';
    }
    function rule(v) {
        return '{ -ms-touch-action: ' + v + '; touch-action: ' + v + '; }';
    }
    var attrib2css = [
        'none',
        'auto',
        'pan-x',
        'pan-y',
        {
            rule: 'pan-x pan-y',
            selectors: [
                'pan-x pan-y',
                'pan-y pan-x'
            ]
        }
    ];
    var styles = '';
    // only install stylesheet if the browser has touch action support
    var hasNativePE = window.PointerEvent || window.MSPointerEvent;
    // only add shadow selectors if shadowdom is supported
    var hasShadowRoot = !window.ShadowDOMPolyfill && document.head.createShadowRoot;
    function applyAttributeStyles() {
        if (hasNativePE) {
            attrib2css.forEach(function (r) {
                if (String(r) === r) {
                    styles += selector(r) + rule(r) + '\n';
                    if (hasShadowRoot) {
                        styles += shadowSelector(r) + rule(r) + '\n';
                    }
                }
                else {
                    styles += r.selectors.map(selector) + rule(r.rule) + '\n';
                    if (hasShadowRoot) {
                        styles += r.selectors.map(shadowSelector) + rule(r.rule) + '\n';
                    }
                }
            });
            var el = document.createElement('style');
            el.textContent = styles;
            document.head.appendChild(el);
        }
    }
    var pointermap = dispatcher.pointermap;
    // radius around touchend that swallows mouse events
    var DEDUP_DIST = 25;
    // left, middle, right, back, forward
    var BUTTON_TO_BUTTONS = [1, 4, 2, 8, 16];
    var HAS_BUTTONS = false;
    try {
        HAS_BUTTONS = new MouseEvent('test', { buttons: 1 }).buttons === 1;
    }
    catch (e) { }
    // handler block for native mouse events
    var mouseEvents = {
        POINTER_ID: 1,
        POINTER_TYPE: 'mouse',
        events: [
            'mousedown',
            'mousemove',
            'mouseup',
            'mouseover',
            'mouseout'
        ],
        register: function (target) {
            dispatcher.listen(target, this.events);
        },
        unregister: function (target) {
            dispatcher.unlisten(target, this.events);
        },
        lastTouches: [],
        // collide with the global mouse listener
        isEventSimulatedFromTouch: function (inEvent) {
            var lts = this.lastTouches;
            var x = inEvent.clientX;
            var y = inEvent.clientY;
            for (var i = 0, l = lts.length, t; i < l && (t = lts[i]); i++) {
                // simulated mouse events will be swallowed near a primary touchend
                var dx = Math.abs(x - t.x);
                var dy = Math.abs(y - t.y);
                if (dx <= DEDUP_DIST && dy <= DEDUP_DIST) {
                    return true;
                }
            }
        },
        prepareEvent: function (inEvent) {
            var e = dispatcher.cloneEvent(inEvent);
            // forward mouse preventDefault
            var pd = e.preventDefault;
            e.preventDefault = function () {
                inEvent.preventDefault();
                pd();
            };
            e.pointerId = this.POINTER_ID;
            e.isPrimary = true;
            e.pointerType = this.POINTER_TYPE;
            return e;
        },
        prepareButtonsForMove: function (e, inEvent) {
            var p = pointermap.get(this.POINTER_ID);
            // Update buttons state after possible out-of-document mouseup.
            if (inEvent.which === 0 || !p) {
                e.buttons = 0;
            }
            else {
                e.buttons = p.buttons;
            }
            inEvent.buttons = e.buttons;
        },
        mousedown: function (inEvent) {
            if (!this.isEventSimulatedFromTouch(inEvent)) {
                var p = pointermap.get(this.POINTER_ID);
                var e = this.prepareEvent(inEvent);
                if (!HAS_BUTTONS) {
                    e.buttons = BUTTON_TO_BUTTONS[e.button];
                    if (p) {
                        e.buttons |= p.buttons;
                    }
                    inEvent.buttons = e.buttons;
                }
                pointermap.set(this.POINTER_ID, inEvent);
                if (!p || p.buttons === 0) {
                    dispatcher.down(e);
                }
                else {
                    dispatcher.move(e);
                }
            }
        },
        mousemove: function (inEvent) {
            if (!this.isEventSimulatedFromTouch(inEvent)) {
                var e = this.prepareEvent(inEvent);
                if (!HAS_BUTTONS) {
                    this.prepareButtonsForMove(e, inEvent);
                }
                e.button = -1;
                pointermap.set(this.POINTER_ID, inEvent);
                dispatcher.move(e);
            }
        },
        mouseup: function (inEvent) {
            if (!this.isEventSimulatedFromTouch(inEvent)) {
                var p = pointermap.get(this.POINTER_ID);
                var e = this.prepareEvent(inEvent);
                if (!HAS_BUTTONS) {
                    var up = BUTTON_TO_BUTTONS[e.button];
                    // Produces wrong state of buttons in Browsers without `buttons` support
                    // when a mouse button that was pressed outside the document is released
                    // inside and other buttons are still pressed down.
                    e.buttons = p ? p.buttons & ~up : 0;
                    inEvent.buttons = e.buttons;
                }
                pointermap.set(this.POINTER_ID, inEvent);
                // Support: Firefox <=44 only
                // FF Ubuntu includes the lifted button in the `buttons` property on
                // mouseup.
                // https://bugzilla.mozilla.org/show_bug.cgi?id=1223366
                e.buttons &= ~BUTTON_TO_BUTTONS[e.button];
                if (e.buttons === 0) {
                    dispatcher.up(e);
                }
                else {
                    dispatcher.move(e);
                }
            }
        },
        mouseover: function (inEvent) {
            if (!this.isEventSimulatedFromTouch(inEvent)) {
                var e = this.prepareEvent(inEvent);
                if (!HAS_BUTTONS) {
                    this.prepareButtonsForMove(e, inEvent);
                }
                e.button = -1;
                pointermap.set(this.POINTER_ID, inEvent);
                dispatcher.enterOver(e);
            }
        },
        mouseout: function (inEvent) {
            if (!this.isEventSimulatedFromTouch(inEvent)) {
                var e = this.prepareEvent(inEvent);
                if (!HAS_BUTTONS) {
                    this.prepareButtonsForMove(e, inEvent);
                }
                e.button = -1;
                dispatcher.leaveOut(e);
            }
        },
        cancel: function (inEvent) {
            var e = this.prepareEvent(inEvent);
            dispatcher.cancel(e);
            this.deactivateMouse();
        },
        deactivateMouse: function () {
            pointermap.delete(this.POINTER_ID);
        }
    };
    var captureInfo = dispatcher.captureInfo;
    var findTarget = targeting.findTarget.bind(targeting);
    var allShadows = targeting.allShadows.bind(targeting);
    var pointermap$1 = dispatcher.pointermap;
    // This should be long enough to ignore compat mouse events made by touch
    var DEDUP_TIMEOUT = 2500;
    var CLICK_COUNT_TIMEOUT = 200;
    var ATTRIB = 'touch-action';
    var INSTALLER;
    // handler block for native touch events
    var touchEvents = {
        events: [
            'touchstart',
            'touchmove',
            'touchend',
            'touchcancel'
        ],
        register: function (target) {
            INSTALLER.enableOnSubtree(target);
        },
        unregister: function () {
            // TODO(dfreedman): is it worth it to disconnect the MO?
        },
        elementAdded: function (el) {
            var a = el.getAttribute(ATTRIB);
            var st = this.touchActionToScrollType(a);
            if (st) {
                el._scrollType = st;
                dispatcher.listen(el, this.events);
                // set touch-action on shadows as well
                allShadows(el).forEach(function (s) {
                    s._scrollType = st;
                    dispatcher.listen(s, this.events);
                }, this);
            }
        },
        elementRemoved: function (el) {
            el._scrollType = undefined;
            dispatcher.unlisten(el, this.events);
            // remove touch-action from shadow
            allShadows(el).forEach(function (s) {
                s._scrollType = undefined;
                dispatcher.unlisten(s, this.events);
            }, this);
        },
        elementChanged: function (el, oldValue) {
            var a = el.getAttribute(ATTRIB);
            var st = this.touchActionToScrollType(a);
            var oldSt = this.touchActionToScrollType(oldValue);
            // simply update scrollType if listeners are already established
            if (st && oldSt) {
                el._scrollType = st;
                allShadows(el).forEach(function (s) {
                    s._scrollType = st;
                }, this);
            }
            else if (oldSt) {
                this.elementRemoved(el);
            }
            else if (st) {
                this.elementAdded(el);
            }
        },
        scrollTypes: {
            EMITTER: 'none',
            XSCROLLER: 'pan-x',
            YSCROLLER: 'pan-y',
            SCROLLER: /^(?:pan-x pan-y)|(?:pan-y pan-x)|auto$/
        },
        touchActionToScrollType: function (touchAction) {
            var t = touchAction;
            var st = this.scrollTypes;
            if (t === 'none') {
                return 'none';
            }
            else if (t === st.XSCROLLER) {
                return 'X';
            }
            else if (t === st.YSCROLLER) {
                return 'Y';
            }
            else if (st.SCROLLER.exec(t)) {
                return 'XY';
            }
        },
        POINTER_TYPE: 'touch',
        firstTouch: null,
        isPrimaryTouch: function (inTouch) {
            return this.firstTouch === inTouch.identifier;
        },
        setPrimaryTouch: function (inTouch) {
            // set primary touch if there no pointers, or the only pointer is the mouse
            if (pointermap$1.size === 0 || (pointermap$1.size === 1 && pointermap$1.has(1))) {
                this.firstTouch = inTouch.identifier;
                this.firstXY = { X: inTouch.clientX, Y: inTouch.clientY };
                this.scrolling = false;
                this.cancelResetClickCount();
            }
        },
        removePrimaryPointer: function (inPointer) {
            if (inPointer.isPrimary) {
                this.firstTouch = null;
                this.firstXY = null;
                this.resetClickCount();
            }
        },
        clickCount: 0,
        resetId: null,
        resetClickCount: function () {
            var fn = function () {
                this.clickCount = 0;
                this.resetId = null;
            }.bind(this);
            this.resetId = setTimeout(fn, CLICK_COUNT_TIMEOUT);
        },
        cancelResetClickCount: function () {
            if (this.resetId) {
                clearTimeout(this.resetId);
            }
        },
        typeToButtons: function (type) {
            var ret = 0;
            if (type === 'touchstart' || type === 'touchmove') {
                ret = 1;
            }
            return ret;
        },
        touchToPointer: function (inTouch) {
            var cte = this.currentTouchEvent;
            var e = dispatcher.cloneEvent(inTouch);
            // We reserve pointerId 1 for Mouse.
            // Touch identifiers can start at 0.
            // Add 2 to the touch identifier for compatibility.
            var id = e.pointerId = inTouch.identifier + 2;
            e.target = captureInfo[id] || findTarget(e);
            e.bubbles = true;
            e.cancelable = true;
            e.detail = this.clickCount;
            e.button = 0;
            e.buttons = this.typeToButtons(cte.type);
            e.width = (inTouch.radiusX || inTouch.webkitRadiusX || 0) * 2;
            e.height = (inTouch.radiusY || inTouch.webkitRadiusY || 0) * 2;
            e.pressure = inTouch.force || inTouch.webkitForce || 0.5;
            e.isPrimary = this.isPrimaryTouch(inTouch);
            e.pointerType = this.POINTER_TYPE;
            // forward modifier keys
            e.altKey = cte.altKey;
            e.ctrlKey = cte.ctrlKey;
            e.metaKey = cte.metaKey;
            e.shiftKey = cte.shiftKey;
            // forward touch preventDefaults
            var self = this;
            e.preventDefault = function () {
                self.scrolling = false;
                self.firstXY = null;
                cte.preventDefault();
            };
            return e;
        },
        processTouches: function (inEvent, inFunction) {
            var tl = inEvent.changedTouches;
            this.currentTouchEvent = inEvent;
            for (var i = 0, t; i < tl.length; i++) {
                t = tl[i];
                inFunction.call(this, this.touchToPointer(t));
            }
        },
        // For single axis scrollers, determines whether the element should emit
        // pointer events or behave as a scroller
        shouldScroll: function (inEvent) {
            if (this.firstXY) {
                var ret;
                var scrollAxis = inEvent.currentTarget._scrollType;
                if (scrollAxis === 'none') {
                    // this element is a touch-action: none, should never scroll
                    ret = false;
                }
                else if (scrollAxis === 'XY') {
                    // this element should always scroll
                    ret = true;
                }
                else {
                    var t = inEvent.changedTouches[0];
                    // check the intended scroll axis, and other axis
                    var a = scrollAxis;
                    var oa = scrollAxis === 'Y' ? 'X' : 'Y';
                    var da = Math.abs(t['client' + a] - this.firstXY[a]);
                    var doa = Math.abs(t['client' + oa] - this.firstXY[oa]);
                    // if delta in the scroll axis > delta other axis, scroll instead of
                    // making events
                    ret = da >= doa;
                }
                this.firstXY = null;
                return ret;
            }
        },
        findTouch: function (inTL, inId) {
            for (var i = 0, l = inTL.length, t; i < l && (t = inTL[i]); i++) {
                if (t.identifier === inId) {
                    return true;
                }
            }
        },
        // In some instances, a touchstart can happen without a touchend. This
        // leaves the pointermap in a broken state.
        // Therefore, on every touchstart, we remove the touches that did not fire a
        // touchend event.
        // To keep state globally consistent, we fire a
        // pointercancel for this "abandoned" touch
        vacuumTouches: function (inEvent) {
            var tl = inEvent.touches;
            // pointermap.size should be < tl.length here, as the touchstart has not
            // been processed yet.
            if (pointermap$1.size >= tl.length) {
                var d = [];
                pointermap$1.forEach(function (value, key) {
                    // Never remove pointerId == 1, which is mouse.
                    // Touch identifiers are 2 smaller than their pointerId, which is the
                    // index in pointermap.
                    if (key !== 1 && !this.findTouch(tl, key - 2)) {
                        var p = value.out;
                        d.push(p);
                    }
                }, this);
                d.forEach(this.cancelOut, this);
            }
        },
        touchstart: function (inEvent) {
            this.vacuumTouches(inEvent);
            this.setPrimaryTouch(inEvent.changedTouches[0]);
            this.dedupSynthMouse(inEvent);
            if (!this.scrolling) {
                this.clickCount++;
                this.processTouches(inEvent, this.overDown);
            }
        },
        overDown: function (inPointer) {
            pointermap$1.set(inPointer.pointerId, {
                target: inPointer.target,
                out: inPointer,
                outTarget: inPointer.target
            });
            dispatcher.enterOver(inPointer);
            dispatcher.down(inPointer);
        },
        touchmove: function (inEvent) {
            if (!this.scrolling) {
                if (this.shouldScroll(inEvent)) {
                    this.scrolling = true;
                    this.touchcancel(inEvent);
                }
                else {
                    inEvent.preventDefault();
                    this.processTouches(inEvent, this.moveOverOut);
                }
            }
        },
        moveOverOut: function (inPointer) {
            var event = inPointer;
            var pointer = pointermap$1.get(event.pointerId);
            // a finger drifted off the screen, ignore it
            if (!pointer) {
                return;
            }
            var outEvent = pointer.out;
            var outTarget = pointer.outTarget;
            dispatcher.move(event);
            if (outEvent && outTarget !== event.target) {
                outEvent.relatedTarget = event.target;
                event.relatedTarget = outTarget;
                // recover from retargeting by shadow
                outEvent.target = outTarget;
                if (event.target) {
                    dispatcher.leaveOut(outEvent);
                    dispatcher.enterOver(event);
                }
                else {
                    // clean up case when finger leaves the screen
                    event.target = outTarget;
                    event.relatedTarget = null;
                    this.cancelOut(event);
                }
            }
            pointer.out = event;
            pointer.outTarget = event.target;
        },
        touchend: function (inEvent) {
            this.dedupSynthMouse(inEvent);
            this.processTouches(inEvent, this.upOut);
        },
        upOut: function (inPointer) {
            if (!this.scrolling) {
                dispatcher.up(inPointer);
                dispatcher.leaveOut(inPointer);
            }
            this.cleanUpPointer(inPointer);
        },
        touchcancel: function (inEvent) {
            this.processTouches(inEvent, this.cancelOut);
        },
        cancelOut: function (inPointer) {
            dispatcher.cancel(inPointer);
            dispatcher.leaveOut(inPointer);
            this.cleanUpPointer(inPointer);
        },
        cleanUpPointer: function (inPointer) {
            pointermap$1.delete(inPointer.pointerId);
            this.removePrimaryPointer(inPointer);
        },
        // prevent synth mouse events from creating pointer events
        dedupSynthMouse: function (inEvent) {
            var lts = mouseEvents.lastTouches;
            var t = inEvent.changedTouches[0];
            // only the primary finger will synth mouse events
            if (this.isPrimaryTouch(t)) {
                // remember x/y of last touch
                var lt = { x: t.clientX, y: t.clientY };
                lts.push(lt);
                var fn = (function (lts, lt) {
                    var i = lts.indexOf(lt);
                    if (i > -1) {
                        lts.splice(i, 1);
                    }
                }).bind(null, lts, lt);
                setTimeout(fn, DEDUP_TIMEOUT);
            }
        }
    };
    INSTALLER = new Installer(touchEvents.elementAdded, touchEvents.elementRemoved, touchEvents.elementChanged, touchEvents);
    var pointermap$2 = dispatcher.pointermap;
    var HAS_BITMAP_TYPE = window.MSPointerEvent &&
        typeof window.MSPointerEvent.MSPOINTER_TYPE_MOUSE === 'number';
    var msEvents = {
        events: [
            'MSPointerDown',
            'MSPointerMove',
            'MSPointerUp',
            'MSPointerOut',
            'MSPointerOver',
            'MSPointerCancel',
            'MSGotPointerCapture',
            'MSLostPointerCapture'
        ],
        register: function (target) {
            dispatcher.listen(target, this.events);
        },
        unregister: function (target) {
            dispatcher.unlisten(target, this.events);
        },
        POINTER_TYPES: [
            '',
            'unavailable',
            'touch',
            'pen',
            'mouse'
        ],
        prepareEvent: function (inEvent) {
            var e = inEvent;
            if (HAS_BITMAP_TYPE) {
                e = dispatcher.cloneEvent(inEvent);
                e.pointerType = this.POINTER_TYPES[inEvent.pointerType];
            }
            return e;
        },
        cleanup: function (id) {
            pointermap$2.delete(id);
        },
        MSPointerDown: function (inEvent) {
            pointermap$2.set(inEvent.pointerId, inEvent);
            var e = this.prepareEvent(inEvent);
            dispatcher.down(e);
        },
        MSPointerMove: function (inEvent) {
            var e = this.prepareEvent(inEvent);
            dispatcher.move(e);
        },
        MSPointerUp: function (inEvent) {
            var e = this.prepareEvent(inEvent);
            dispatcher.up(e);
            this.cleanup(inEvent.pointerId);
        },
        MSPointerOut: function (inEvent) {
            var e = this.prepareEvent(inEvent);
            dispatcher.leaveOut(e);
        },
        MSPointerOver: function (inEvent) {
            var e = this.prepareEvent(inEvent);
            dispatcher.enterOver(e);
        },
        MSPointerCancel: function (inEvent) {
            var e = this.prepareEvent(inEvent);
            dispatcher.cancel(e);
            this.cleanup(inEvent.pointerId);
        },
        MSLostPointerCapture: function (inEvent) {
            var e = dispatcher.makeEvent('lostpointercapture', inEvent);
            dispatcher.dispatchEvent(e);
        },
        MSGotPointerCapture: function (inEvent) {
            var e = dispatcher.makeEvent('gotpointercapture', inEvent);
            dispatcher.dispatchEvent(e);
        }
    };
    function applyPolyfill() {
        // only activate if this platform does not have pointer events
        if (!window.PointerEvent) {
            window.PointerEvent = PointerEvent;
            if (window.navigator.msPointerEnabled) {
                var tp = window.navigator.msMaxTouchPoints;
                Object.defineProperty(window.navigator, 'maxTouchPoints', {
                    value: tp,
                    enumerable: true
                });
                dispatcher.registerSource('ms', msEvents);
            }
            else {
                Object.defineProperty(window.navigator, 'maxTouchPoints', {
                    value: 0,
                    enumerable: true
                });
                dispatcher.registerSource('mouse', mouseEvents);
                if (window.ontouchstart !== undefined) {
                    dispatcher.registerSource('touch', touchEvents);
                }
            }
            dispatcher.register(document);
        }
    }
    var n = window.navigator;
    var s;
    var r;
    var h;
    function assertActive(id) {
        if (!dispatcher.pointermap.has(id)) {
            var error = new Error('InvalidPointerId');
            error.name = 'InvalidPointerId';
            throw error;
        }
    }
    function assertConnected(elem) {
        var parent = elem.parentNode;
        while (parent && parent !== elem.ownerDocument) {
            parent = parent.parentNode;
        }
        if (!parent) {
            var error = new Error('InvalidStateError');
            error.name = 'InvalidStateError';
            throw error;
        }
    }
    function inActiveButtonState(id) {
        var p = dispatcher.pointermap.get(id);
        return p.buttons !== 0;
    }
    if (n.msPointerEnabled) {
        s = function (pointerId) {
            assertActive(pointerId);
            assertConnected(this);
            if (inActiveButtonState(pointerId)) {
                dispatcher.setCapture(pointerId, this, true);
                this.msSetPointerCapture(pointerId);
            }
        };
        r = function (pointerId) {
            assertActive(pointerId);
            dispatcher.releaseCapture(pointerId, true);
            this.msReleasePointerCapture(pointerId);
        };
    }
    else {
        s = function setPointerCapture(pointerId) {
            assertActive(pointerId);
            assertConnected(this);
            if (inActiveButtonState(pointerId)) {
                dispatcher.setCapture(pointerId, this);
            }
        };
        r = function releasePointerCapture(pointerId) {
            assertActive(pointerId);
            dispatcher.releaseCapture(pointerId);
        };
    }
    h = function hasPointerCapture(pointerId) {
        return !!dispatcher.captureInfo[pointerId];
    };
    function applyPolyfill$1() {
        if (window.Element && !Element.prototype.setPointerCapture) {
            Object.defineProperties(Element.prototype, {
                'setPointerCapture': {
                    value: s
                },
                'releasePointerCapture': {
                    value: r
                },
                'hasPointerCapture': {
                    value: h
                }
            });
        }
    }
    applyAttributeStyles();
    applyPolyfill();
    applyPolyfill$1();
    var pointerevents = {
        dispatcher: dispatcher,
        Installer: Installer,
        PointerEvent: PointerEvent,
        PointerMap: PointerMap,
        targetFinding: targeting
    };
    return pointerevents;
}));
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2017 Kris Kowal under the terms of the MIT
 * license found at https://github.com/kriskowal/q/blob/v1/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
(function (definition) {
    "use strict";
    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.
    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);
        // CommonJS
    }
    else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();
        // RequireJS
    }
    else if (typeof define === "function" && define.amd) {
        define(definition);
        // SES (Secure EcmaScript)
    }
    else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        }
        else {
            ses.makeQ = definition;
        }
        // <script>
    }
    else if (typeof window !== "undefined" || typeof self !== "undefined") {
        // Prefer window over self for add-on scripts. Use self for
        // non-windowed contexts.
        var global = typeof window !== "undefined" ? window : self;
        // Get the `window` object, save the previous Q global
        // and initialize Q as a global.
        var previousQ = global.Q;
        global.Q = definition();
        // Add a noConflict function so Q can be removed from the
        // global namespace.
        global.Q.noConflict = function () {
            global.Q = previousQ;
            return this;
        };
    }
    else {
        throw new Error("This environment was not anticipated by Q. Please file a bug.");
    }
})(function () {
    "use strict";
    var hasStacks = false;
    try {
        throw new Error();
    }
    catch (e) {
        hasStacks = !!e.stack;
    }
    // All code after this point will be filtered from stack traces reported
    // by Q.
    var qStartingLine = captureLine();
    var qFileName;
    // shims
    // used for fallback in "allResolved"
    var noop = function () { };
    // Use the fastest possible means to execute a task in a future turn
    // of the event loop.
    var nextTick = (function () {
        // linked list of tasks (single, with head node)
        var head = { task: void 0, next: null };
        var tail = head;
        var flushing = false;
        var requestTick = void 0;
        var isNodeJS = false;
        // queue for late tasks, used by unhandled rejection tracking
        var laterQueue = [];
        function flush() {
            /* jshint loopfunc: true */
            var task, domain;
            while (head.next) {
                head = head.next;
                task = head.task;
                head.task = void 0;
                domain = head.domain;
                if (domain) {
                    head.domain = void 0;
                    domain.enter();
                }
                runSingle(task, domain);
            }
            while (laterQueue.length) {
                task = laterQueue.pop();
                runSingle(task);
            }
            flushing = false;
        }
        // runs a single function in the async queue
        function runSingle(task, domain) {
            try {
                task();
            }
            catch (e) {
                if (isNodeJS) {
                    // In node, uncaught exceptions are considered fatal errors.
                    // Re-throw them synchronously to interrupt flushing!
                    // Ensure continuation if the uncaught exception is suppressed
                    // listening "uncaughtException" events (as domains does).
                    // Continue in next event to avoid tick recursion.
                    if (domain) {
                        domain.exit();
                    }
                    setTimeout(flush, 0);
                    if (domain) {
                        domain.enter();
                    }
                    throw e;
                }
                else {
                    // In browsers, uncaught exceptions are not fatal.
                    // Re-throw them asynchronously to avoid slow-downs.
                    setTimeout(function () {
                        throw e;
                    }, 0);
                }
            }
            if (domain) {
                domain.exit();
            }
        }
        nextTick = function (task) {
            tail = tail.next = {
                task: task,
                domain: isNodeJS && process.domain,
                next: null
            };
            if (!flushing) {
                flushing = true;
                requestTick();
            }
        };
        if (typeof process === "object" &&
            process.toString() === "[object process]" && process.nextTick) {
            // Ensure Q is in a real Node environment, with a `process.nextTick`.
            // To see through fake Node environments:
            // * Mocha test runner - exposes a `process` global without a `nextTick`
            // * Browserify - exposes a `process.nexTick` function that uses
            //   `setTimeout`. In this case `setImmediate` is preferred because
            //    it is faster. Browserify's `process.toString()` yields
            //   "[object Object]", while in a real Node environment
            //   `process.toString()` yields "[object process]".
            isNodeJS = true;
            requestTick = function () {
                process.nextTick(flush);
            };
        }
        else if (typeof setImmediate === "function") {
            // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
            if (typeof window !== "undefined") {
                requestTick = setImmediate.bind(window, flush);
            }
            else {
                requestTick = function () {
                    setImmediate(flush);
                };
            }
        }
        else if (typeof MessageChannel !== "undefined") {
            // modern browsers
            // http://www.nonblocking.io/2011/06/windownexttick.html
            var channel = new MessageChannel();
            // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
            // working message ports the first time a page loads.
            channel.port1.onmessage = function () {
                requestTick = requestPortTick;
                channel.port1.onmessage = flush;
                flush();
            };
            var requestPortTick = function () {
                // Opera requires us to provide a message payload, regardless of
                // whether we use it.
                channel.port2.postMessage(0);
            };
            requestTick = function () {
                setTimeout(flush, 0);
                requestPortTick();
            };
        }
        else {
            // old browsers
            requestTick = function () {
                setTimeout(flush, 0);
            };
        }
        // runs a task after all other tasks have been run
        // this is useful for unhandled rejection tracking that needs to happen
        // after all `then`d tasks have been run.
        nextTick.runAfter = function (task) {
            laterQueue.push(task);
            if (!flushing) {
                flushing = true;
                requestTick();
            }
        };
        return nextTick;
    })();
    // Attempt to make generics safe in the face of downstream
    // modifications.
    // There is no situation where this is necessary.
    // If you need a security guarantee, these primordials need to be
    // deeply frozen anyway, and if you don’t need a security guarantee,
    // this is just plain paranoid.
    // However, this **might** have the nice side-effect of reducing the size of
    // the minified code by reducing x.call() to merely x()
    // See Mark Miller’s explanation of what this does.
    // http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
    var call = Function.call;
    function uncurryThis(f) {
        return function () {
            return call.apply(f, arguments);
        };
    }
    // This is equivalent, but slower:
    // uncurryThis = Function_bind.bind(Function_bind.call);
    // http://jsperf.com/uncurrythis
    var array_slice = uncurryThis(Array.prototype.slice);
    var array_reduce = uncurryThis(Array.prototype.reduce || function (callback, basis) {
        var index = 0, length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    });
    var array_indexOf = uncurryThis(Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    });
    var array_map = uncurryThis(Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    });
    var object_create = Object.create || function (prototype) {
        function Type() { }
        Type.prototype = prototype;
        return new Type();
    };
    var object_defineProperty = Object.defineProperty || function (obj, prop, descriptor) {
        obj[prop] = descriptor.value;
        return obj;
    };
    var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);
    var object_keys = Object.keys || function (object) {
        var keys = [];
        for (var key in object) {
            if (object_hasOwnProperty(object, key)) {
                keys.push(key);
            }
        }
        return keys;
    };
    var object_toString = uncurryThis(Object.prototype.toString);
    function isObject(value) {
        return value === Object(value);
    }
    // generator related shims
    // FIXME: Remove this function once ES6 generators are in SpiderMonkey.
    function isStopIteration(exception) {
        return (object_toString(exception) === "[object StopIteration]" ||
            exception instanceof QReturnValue);
    }
    // FIXME: Remove this helper and Q.return once ES6 generators are in
    // SpiderMonkey.
    var QReturnValue;
    if (typeof ReturnValue !== "undefined") {
        QReturnValue = ReturnValue;
    }
    else {
        QReturnValue = function (value) {
            this.value = value;
        };
    }
    // long stack traces
    var STACK_JUMP_SEPARATOR = "From previous event:";
    function makeStackTraceLong(error, promise) {
        // If possible, transform the error stack trace by removing Node and Q
        // cruft, then concatenating with the stack trace of `promise`. See #57.
        if (hasStacks &&
            promise.stack &&
            typeof error === "object" &&
            error !== null &&
            error.stack) {
            var stacks = [];
            for (var p = promise; !!p; p = p.source) {
                if (p.stack && (!error.__minimumStackCounter__ || error.__minimumStackCounter__ > p.stackCounter)) {
                    object_defineProperty(error, "__minimumStackCounter__", { value: p.stackCounter, configurable: true });
                    stacks.unshift(p.stack);
                }
            }
            stacks.unshift(error.stack);
            var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
            var stack = filterStackString(concatedStacks);
            object_defineProperty(error, "stack", { value: stack, configurable: true });
        }
    }
    function filterStackString(stackString) {
        var lines = stackString.split("\n");
        var desiredLines = [];
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i];
            if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
                desiredLines.push(line);
            }
        }
        return desiredLines.join("\n");
    }
    function isNodeFrame(stackLine) {
        return stackLine.indexOf("(module.js:") !== -1 ||
            stackLine.indexOf("(node.js:") !== -1;
    }
    function getFileNameAndLineNumber(stackLine) {
        // Named functions: "at functionName (filename:lineNumber:columnNumber)"
        // In IE10 function name can have spaces ("Anonymous function") O_o
        var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
        if (attempt1) {
            return [attempt1[1], Number(attempt1[2])];
        }
        // Anonymous functions: "at filename:lineNumber:columnNumber"
        var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
        if (attempt2) {
            return [attempt2[1], Number(attempt2[2])];
        }
        // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
        var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
        if (attempt3) {
            return [attempt3[1], Number(attempt3[2])];
        }
    }
    function isInternalFrame(stackLine) {
        var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);
        if (!fileNameAndLineNumber) {
            return false;
        }
        var fileName = fileNameAndLineNumber[0];
        var lineNumber = fileNameAndLineNumber[1];
        return fileName === qFileName &&
            lineNumber >= qStartingLine &&
            lineNumber <= qEndingLine;
    }
    // discover own file name and line number range for filtering stack
    // traces
    function captureLine() {
        if (!hasStacks) {
            return;
        }
        try {
            throw new Error();
        }
        catch (e) {
            var lines = e.stack.split("\n");
            var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
            var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
            if (!fileNameAndLineNumber) {
                return;
            }
            qFileName = fileNameAndLineNumber[0];
            return fileNameAndLineNumber[1];
        }
    }
    function deprecate(callback, name, alternative) {
        return function () {
            if (typeof console !== "undefined" &&
                typeof console.warn === "function") {
                console.warn(name + " is deprecated, use " + alternative +
                    " instead.", new Error("").stack);
            }
            return callback.apply(callback, arguments);
        };
    }
    // end of shims
    // beginning of real work
    /**
     * Constructs a promise for an immediate reference, passes promises through, or
     * coerces promises from different systems.
     * @param value immediate reference or promise
     */
    function Q(value) {
        // If the object is already a Promise, return it directly.  This enables
        // the resolve function to both be used to created references from objects,
        // but to tolerably coerce non-promises to promises.
        if (value instanceof Promise) {
            return value;
        }
        // assimilate thenables
        if (isPromiseAlike(value)) {
            return coerce(value);
        }
        else {
            return fulfill(value);
        }
    }
    Q.resolve = Q;
    /**
     * Performs a task in a future turn of the event loop.
     * @param {Function} task
     */
    Q.nextTick = nextTick;
    /**
     * Controls whether or not long stack traces will be on
     */
    Q.longStackSupport = false;
    /**
     * The counter is used to determine the stopping point for building
     * long stack traces. In makeStackTraceLong we walk backwards through
     * the linked list of promises, only stacks which were created before
     * the rejection are concatenated.
     */
    var longStackCounter = 1;
    // enable long stacks if Q_DEBUG is set
    if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
        Q.longStackSupport = true;
    }
    /**
     * Constructs a {promise, resolve, reject} object.
     *
     * `resolve` is a callback to invoke with a more resolved value for the
     * promise. To fulfill the promise, invoke `resolve` with any value that is
     * not a thenable. To reject the promise, invoke `resolve` with a rejected
     * thenable, or invoke `reject` with the reason directly. To resolve the
     * promise to another thenable, thus putting it in the same state, invoke
     * `resolve` with that other thenable.
     */
    Q.defer = defer;
    function defer() {
        // if "messages" is an "Array", that indicates that the promise has not yet
        // been resolved.  If it is "undefined", it has been resolved.  Each
        // element of the messages array is itself an array of complete arguments to
        // forward to the resolved promise.  We coerce the resolution value to a
        // promise using the `resolve` function because it handles both fully
        // non-thenable values and other thenables gracefully.
        var messages = [], progressListeners = [], resolvedPromise;
        var deferred = object_create(defer.prototype);
        var promise = object_create(Promise.prototype);
        promise.promiseDispatch = function (resolve, op, operands) {
            var args = array_slice(arguments);
            if (messages) {
                messages.push(args);
                if (op === "when" && operands[1]) {
                    progressListeners.push(operands[1]);
                }
            }
            else {
                Q.nextTick(function () {
                    resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
                });
            }
        };
        // XXX deprecated
        promise.valueOf = function () {
            if (messages) {
                return promise;
            }
            var nearerValue = nearer(resolvedPromise);
            if (isPromise(nearerValue)) {
                resolvedPromise = nearerValue; // shorten chain
            }
            return nearerValue;
        };
        promise.inspect = function () {
            if (!resolvedPromise) {
                return { state: "pending" };
            }
            return resolvedPromise.inspect();
        };
        if (Q.longStackSupport && hasStacks) {
            try {
                throw new Error();
            }
            catch (e) {
                // NOTE: don't try to use `Error.captureStackTrace` or transfer the
                // accessor around; that causes memory leaks as per GH-111. Just
                // reify the stack trace as a string ASAP.
                //
                // At the same time, cut off the first line; it's always just
                // "[object Promise]\n", as per the `toString`.
                promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
                promise.stackCounter = longStackCounter++;
            }
        }
        // NOTE: we do the checks for `resolvedPromise` in each method, instead of
        // consolidating them into `become`, since otherwise we'd create new
        // promises with the lines `become(whatever(value))`. See e.g. GH-252.
        function become(newPromise) {
            resolvedPromise = newPromise;
            if (Q.longStackSupport && hasStacks) {
                // Only hold a reference to the new promise if long stacks
                // are enabled to reduce memory usage
                promise.source = newPromise;
            }
            array_reduce(messages, function (undefined, message) {
                Q.nextTick(function () {
                    newPromise.promiseDispatch.apply(newPromise, message);
                });
            }, void 0);
            messages = void 0;
            progressListeners = void 0;
        }
        deferred.promise = promise;
        deferred.resolve = function (value) {
            if (resolvedPromise) {
                return;
            }
            become(Q(value));
        };
        deferred.fulfill = function (value) {
            if (resolvedPromise) {
                return;
            }
            become(fulfill(value));
        };
        deferred.reject = function (reason) {
            if (resolvedPromise) {
                return;
            }
            become(reject(reason));
        };
        deferred.notify = function (progress) {
            if (resolvedPromise) {
                return;
            }
            array_reduce(progressListeners, function (undefined, progressListener) {
                Q.nextTick(function () {
                    progressListener(progress);
                });
            }, void 0);
        };
        return deferred;
    }
    /**
     * Creates a Node-style callback that will resolve or reject the deferred
     * promise.
     * @returns a nodeback
     */
    defer.prototype.makeNodeResolver = function () {
        var self = this;
        return function (error, value) {
            if (error) {
                self.reject(error);
            }
            else if (arguments.length > 2) {
                self.resolve(array_slice(arguments, 1));
            }
            else {
                self.resolve(value);
            }
        };
    };
    /**
     * @param resolver {Function} a function that returns nothing and accepts
     * the resolve, reject, and notify functions for a deferred.
     * @returns a promise that may be resolved with the given resolve and reject
     * functions, or rejected by a thrown exception in resolver
     */
    Q.Promise = promise; // ES6
    Q.promise = promise;
    function promise(resolver) {
        if (typeof resolver !== "function") {
            throw new TypeError("resolver must be a function.");
        }
        var deferred = defer();
        try {
            resolver(deferred.resolve, deferred.reject, deferred.notify);
        }
        catch (reason) {
            deferred.reject(reason);
        }
        return deferred.promise;
    }
    promise.race = race; // ES6
    promise.all = all; // ES6
    promise.reject = reject; // ES6
    promise.resolve = Q; // ES6
    // XXX experimental.  This method is a way to denote that a local value is
    // serializable and should be immediately dispatched to a remote upon request,
    // instead of passing a reference.
    Q.passByCopy = function (object) {
        //freeze(object);
        //passByCopies.set(object, true);
        return object;
    };
    Promise.prototype.passByCopy = function () {
        //freeze(object);
        //passByCopies.set(object, true);
        return this;
    };
    /**
     * If two promises eventually fulfill to the same value, promises that value,
     * but otherwise rejects.
     * @param x {Any*}
     * @param y {Any*}
     * @returns {Any*} a promise for x and y if they are the same, but a rejection
     * otherwise.
     *
     */
    Q.join = function (x, y) {
        return Q(x).join(y);
    };
    Promise.prototype.join = function (that) {
        return Q([this, that]).spread(function (x, y) {
            if (x === y) {
                // TODO: "===" should be Object.is or equiv
                return x;
            }
            else {
                throw new Error("Q can't join: not the same: " + x + " " + y);
            }
        });
    };
    /**
     * Returns a promise for the first of an array of promises to become settled.
     * @param answers {Array[Any*]} promises to race
     * @returns {Any*} the first promise to be settled
     */
    Q.race = race;
    function race(answerPs) {
        return promise(function (resolve, reject) {
            // Switch to this once we can assume at least ES5
            // answerPs.forEach(function (answerP) {
            //     Q(answerP).then(resolve, reject);
            // });
            // Use this in the meantime
            for (var i = 0, len = answerPs.length; i < len; i++) {
                Q(answerPs[i]).then(resolve, reject);
            }
        });
    }
    Promise.prototype.race = function () {
        return this.then(Q.race);
    };
    /**
     * Constructs a Promise with a promise descriptor object and optional fallback
     * function.  The descriptor contains methods like when(rejected), get(name),
     * set(name, value), post(name, args), and delete(name), which all
     * return either a value, a promise for a value, or a rejection.  The fallback
     * accepts the operation name, a resolver, and any further arguments that would
     * have been forwarded to the appropriate method above had a method been
     * provided with the proper name.  The API makes no guarantees about the nature
     * of the returned object, apart from that it is usable whereever promises are
     * bought and sold.
     */
    Q.makePromise = Promise;
    function Promise(descriptor, fallback, inspect) {
        if (fallback === void 0) {
            fallback = function (op) {
                return reject(new Error("Promise does not support operation: " + op));
            };
        }
        if (inspect === void 0) {
            inspect = function () {
                return { state: "unknown" };
            };
        }
        var promise = object_create(Promise.prototype);
        promise.promiseDispatch = function (resolve, op, args) {
            var result;
            try {
                if (descriptor[op]) {
                    result = descriptor[op].apply(promise, args);
                }
                else {
                    result = fallback.call(promise, op, args);
                }
            }
            catch (exception) {
                result = reject(exception);
            }
            if (resolve) {
                resolve(result);
            }
        };
        promise.inspect = inspect;
        // XXX deprecated `valueOf` and `exception` support
        if (inspect) {
            var inspected = inspect();
            if (inspected.state === "rejected") {
                promise.exception = inspected.reason;
            }
            promise.valueOf = function () {
                var inspected = inspect();
                if (inspected.state === "pending" ||
                    inspected.state === "rejected") {
                    return promise;
                }
                return inspected.value;
            };
        }
        return promise;
    }
    Promise.prototype.toString = function () {
        return "[object Promise]";
    };
    Promise.prototype.then = function (fulfilled, rejected, progressed) {
        var self = this;
        var deferred = defer();
        var done = false; // ensure the untrusted promise makes at most a
        // single call to one of the callbacks
        function _fulfilled(value) {
            try {
                return typeof fulfilled === "function" ? fulfilled(value) : value;
            }
            catch (exception) {
                return reject(exception);
            }
        }
        function _rejected(exception) {
            if (typeof rejected === "function") {
                makeStackTraceLong(exception, self);
                try {
                    return rejected(exception);
                }
                catch (newException) {
                    return reject(newException);
                }
            }
            return reject(exception);
        }
        function _progressed(value) {
            return typeof progressed === "function" ? progressed(value) : value;
        }
        Q.nextTick(function () {
            self.promiseDispatch(function (value) {
                if (done) {
                    return;
                }
                done = true;
                deferred.resolve(_fulfilled(value));
            }, "when", [function (exception) {
                    if (done) {
                        return;
                    }
                    done = true;
                    deferred.resolve(_rejected(exception));
                }]);
        });
        // Progress propagator need to be attached in the current tick.
        self.promiseDispatch(void 0, "when", [void 0, function (value) {
                var newValue;
                var threw = false;
                try {
                    newValue = _progressed(value);
                }
                catch (e) {
                    threw = true;
                    if (Q.onerror) {
                        Q.onerror(e);
                    }
                    else {
                        throw e;
                    }
                }
                if (!threw) {
                    deferred.notify(newValue);
                }
            }]);
        return deferred.promise;
    };
    Q.tap = function (promise, callback) {
        return Q(promise).tap(callback);
    };
    /**
     * Works almost like "finally", but not called for rejections.
     * Original resolution value is passed through callback unaffected.
     * Callback may return a promise that will be awaited for.
     * @param {Function} callback
     * @returns {Q.Promise}
     * @example
     * doSomething()
     *   .then(...)
     *   .tap(console.log)
     *   .then(...);
     */
    Promise.prototype.tap = function (callback) {
        callback = Q(callback);
        return this.then(function (value) {
            return callback.fcall(value).thenResolve(value);
        });
    };
    /**
     * Registers an observer on a promise.
     *
     * Guarantees:
     *
     * 1. that fulfilled and rejected will be called only once.
     * 2. that either the fulfilled callback or the rejected callback will be
     *    called, but not both.
     * 3. that fulfilled and rejected will not be called in this turn.
     *
     * @param value      promise or immediate reference to observe
     * @param fulfilled  function to be called with the fulfilled value
     * @param rejected   function to be called with the rejection exception
     * @param progressed function to be called on any progress notifications
     * @return promise for the return value from the invoked callback
     */
    Q.when = when;
    function when(value, fulfilled, rejected, progressed) {
        return Q(value).then(fulfilled, rejected, progressed);
    }
    Promise.prototype.thenResolve = function (value) {
        return this.then(function () { return value; });
    };
    Q.thenResolve = function (promise, value) {
        return Q(promise).thenResolve(value);
    };
    Promise.prototype.thenReject = function (reason) {
        return this.then(function () { throw reason; });
    };
    Q.thenReject = function (promise, reason) {
        return Q(promise).thenReject(reason);
    };
    /**
     * If an object is not a promise, it is as "near" as possible.
     * If a promise is rejected, it is as "near" as possible too.
     * If it’s a fulfilled promise, the fulfillment value is nearer.
     * If it’s a deferred promise and the deferred has been resolved, the
     * resolution is "nearer".
     * @param object
     * @returns most resolved (nearest) form of the object
     */
    // XXX should we re-do this?
    Q.nearer = nearer;
    function nearer(value) {
        if (isPromise(value)) {
            var inspected = value.inspect();
            if (inspected.state === "fulfilled") {
                return inspected.value;
            }
        }
        return value;
    }
    /**
     * @returns whether the given object is a promise.
     * Otherwise it is a fulfilled value.
     */
    Q.isPromise = isPromise;
    function isPromise(object) {
        return object instanceof Promise;
    }
    Q.isPromiseAlike = isPromiseAlike;
    function isPromiseAlike(object) {
        return isObject(object) && typeof object.then === "function";
    }
    /**
     * @returns whether the given object is a pending promise, meaning not
     * fulfilled or rejected.
     */
    Q.isPending = isPending;
    function isPending(object) {
        return isPromise(object) && object.inspect().state === "pending";
    }
    Promise.prototype.isPending = function () {
        return this.inspect().state === "pending";
    };
    /**
     * @returns whether the given object is a value or fulfilled
     * promise.
     */
    Q.isFulfilled = isFulfilled;
    function isFulfilled(object) {
        return !isPromise(object) || object.inspect().state === "fulfilled";
    }
    Promise.prototype.isFulfilled = function () {
        return this.inspect().state === "fulfilled";
    };
    /**
     * @returns whether the given object is a rejected promise.
     */
    Q.isRejected = isRejected;
    function isRejected(object) {
        return isPromise(object) && object.inspect().state === "rejected";
    }
    Promise.prototype.isRejected = function () {
        return this.inspect().state === "rejected";
    };
    //// BEGIN UNHANDLED REJECTION TRACKING
    // This promise library consumes exceptions thrown in handlers so they can be
    // handled by a subsequent promise.  The exceptions get added to this array when
    // they are created, and removed when they are handled.  Note that in ES6 or
    // shimmed environments, this would naturally be a `Set`.
    var unhandledReasons = [];
    var unhandledRejections = [];
    var reportedUnhandledRejections = [];
    var trackUnhandledRejections = true;
    function resetUnhandledRejections() {
        unhandledReasons.length = 0;
        unhandledRejections.length = 0;
        if (!trackUnhandledRejections) {
            trackUnhandledRejections = true;
        }
    }
    function trackRejection(promise, reason) {
        if (!trackUnhandledRejections) {
            return;
        }
        if (typeof process === "object" && typeof process.emit === "function") {
            Q.nextTick.runAfter(function () {
                if (array_indexOf(unhandledRejections, promise) !== -1) {
                    process.emit("unhandledRejection", reason, promise);
                    reportedUnhandledRejections.push(promise);
                }
            });
        }
        unhandledRejections.push(promise);
        if (reason && typeof reason.stack !== "undefined") {
            unhandledReasons.push(reason.stack);
        }
        else {
            unhandledReasons.push("(no stack) " + reason);
        }
    }
    function untrackRejection(promise) {
        if (!trackUnhandledRejections) {
            return;
        }
        var at = array_indexOf(unhandledRejections, promise);
        if (at !== -1) {
            if (typeof process === "object" && typeof process.emit === "function") {
                Q.nextTick.runAfter(function () {
                    var atReport = array_indexOf(reportedUnhandledRejections, promise);
                    if (atReport !== -1) {
                        process.emit("rejectionHandled", unhandledReasons[at], promise);
                        reportedUnhandledRejections.splice(atReport, 1);
                    }
                });
            }
            unhandledRejections.splice(at, 1);
            unhandledReasons.splice(at, 1);
        }
    }
    Q.resetUnhandledRejections = resetUnhandledRejections;
    Q.getUnhandledReasons = function () {
        // Make a copy so that consumers can't interfere with our internal state.
        return unhandledReasons.slice();
    };
    Q.stopUnhandledRejectionTracking = function () {
        resetUnhandledRejections();
        trackUnhandledRejections = false;
    };
    resetUnhandledRejections();
    //// END UNHANDLED REJECTION TRACKING
    /**
     * Constructs a rejected promise.
     * @param reason value describing the failure
     */
    Q.reject = reject;
    function reject(reason) {
        var rejection = Promise({
            "when": function (rejected) {
                // note that the error has been handled
                if (rejected) {
                    untrackRejection(this);
                }
                return rejected ? rejected(reason) : this;
            }
        }, function fallback() {
            return this;
        }, function inspect() {
            return { state: "rejected", reason: reason };
        });
        // Note that the reason has not been handled.
        trackRejection(rejection, reason);
        return rejection;
    }
    /**
     * Constructs a fulfilled promise for an immediate reference.
     * @param value immediate reference
     */
    Q.fulfill = fulfill;
    function fulfill(value) {
        return Promise({
            "when": function () {
                return value;
            },
            "get": function (name) {
                return value[name];
            },
            "set": function (name, rhs) {
                value[name] = rhs;
            },
            "delete": function (name) {
                delete value[name];
            },
            "post": function (name, args) {
                // Mark Miller proposes that post with no name should apply a
                // promised function.
                if (name === null || name === void 0) {
                    return value.apply(void 0, args);
                }
                else {
                    return value[name].apply(value, args);
                }
            },
            "apply": function (thisp, args) {
                return value.apply(thisp, args);
            },
            "keys": function () {
                return object_keys(value);
            }
        }, void 0, function inspect() {
            return { state: "fulfilled", value: value };
        });
    }
    /**
     * Converts thenables to Q promises.
     * @param promise thenable promise
     * @returns a Q promise
     */
    function coerce(promise) {
        var deferred = defer();
        Q.nextTick(function () {
            try {
                promise.then(deferred.resolve, deferred.reject, deferred.notify);
            }
            catch (exception) {
                deferred.reject(exception);
            }
        });
        return deferred.promise;
    }
    /**
     * Annotates an object such that it will never be
     * transferred away from this process over any promise
     * communication channel.
     * @param object
     * @returns promise a wrapping of that object that
     * additionally responds to the "isDef" message
     * without a rejection.
     */
    Q.master = master;
    function master(object) {
        return Promise({
            "isDef": function () { }
        }, function fallback(op, args) {
            return dispatch(object, op, args);
        }, function () {
            return Q(object).inspect();
        });
    }
    /**
     * Spreads the values of a promised array of arguments into the
     * fulfillment callback.
     * @param fulfilled callback that receives variadic arguments from the
     * promised array
     * @param rejected callback that receives the exception if the promise
     * is rejected.
     * @returns a promise for the return value or thrown exception of
     * either callback.
     */
    Q.spread = spread;
    function spread(value, fulfilled, rejected) {
        return Q(value).spread(fulfilled, rejected);
    }
    Promise.prototype.spread = function (fulfilled, rejected) {
        return this.all().then(function (array) {
            return fulfilled.apply(void 0, array);
        }, rejected);
    };
    /**
     * The async function is a decorator for generator functions, turning
     * them into asynchronous generators.  Although generators are only part
     * of the newest ECMAScript 6 drafts, this code does not cause syntax
     * errors in older engines.  This code should continue to work and will
     * in fact improve over time as the language improves.
     *
     * ES6 generators are currently part of V8 version 3.19 with the
     * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
     * for longer, but under an older Python-inspired form.  This function
     * works on both kinds of generators.
     *
     * Decorates a generator function such that:
     *  - it may yield promises
     *  - execution will continue when that promise is fulfilled
     *  - the value of the yield expression will be the fulfilled value
     *  - it returns a promise for the return value (when the generator
     *    stops iterating)
     *  - the decorated function returns a promise for the return value
     *    of the generator or the first rejected promise among those
     *    yielded.
     *  - if an error is thrown in the generator, it propagates through
     *    every following yield until it is caught, or until it escapes
     *    the generator function altogether, and is translated into a
     *    rejection for the promise returned by the decorated generator.
     */
    Q.async = async;
    function async(makeGenerator) {
        return function () {
            // when verb is "send", arg is a value
            // when verb is "throw", arg is an exception
            function continuer(verb, arg) {
                var result;
                // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
                // engine that has a deployed base of browsers that support generators.
                // However, SM's generators use the Python-inspired semantics of
                // outdated ES6 drafts.  We would like to support ES6, but we'd also
                // like to make it possible to use generators in deployed browsers, so
                // we also support Python-style generators.  At some point we can remove
                // this block.
                if (typeof StopIteration === "undefined") {
                    // ES6 Generators
                    try {
                        result = generator[verb](arg);
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                    if (result.done) {
                        return Q(result.value);
                    }
                    else {
                        return when(result.value, callback, errback);
                    }
                }
                else {
                    // SpiderMonkey Generators
                    // FIXME: Remove this case when SM does ES6 generators.
                    try {
                        result = generator[verb](arg);
                    }
                    catch (exception) {
                        if (isStopIteration(exception)) {
                            return Q(exception.value);
                        }
                        else {
                            return reject(exception);
                        }
                    }
                    return when(result, callback, errback);
                }
            }
            var generator = makeGenerator.apply(this, arguments);
            var callback = continuer.bind(continuer, "next");
            var errback = continuer.bind(continuer, "throw");
            return callback();
        };
    }
    /**
     * The spawn function is a small wrapper around async that immediately
     * calls the generator and also ends the promise chain, so that any
     * unhandled errors are thrown instead of forwarded to the error
     * handler. This is useful because it's extremely common to run
     * generators at the top-level to work with libraries.
     */
    Q.spawn = spawn;
    function spawn(makeGenerator) {
        Q.done(Q.async(makeGenerator)());
    }
    // FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
    /**
     * Throws a ReturnValue exception to stop an asynchronous generator.
     *
     * This interface is a stop-gap measure to support generator return
     * values in older Firefox/SpiderMonkey.  In browsers that support ES6
     * generators like Chromium 29, just use "return" in your generator
     * functions.
     *
     * @param value the return value for the surrounding generator
     * @throws ReturnValue exception with the value.
     * @example
     * // ES6 style
     * Q.async(function* () {
     *      var foo = yield getFooPromise();
     *      var bar = yield getBarPromise();
     *      return foo + bar;
     * })
     * // Older SpiderMonkey style
     * Q.async(function () {
     *      var foo = yield getFooPromise();
     *      var bar = yield getBarPromise();
     *      Q.return(foo + bar);
     * })
     */
    Q["return"] = _return;
    function _return(value) {
        throw new QReturnValue(value);
    }
    /**
     * The promised function decorator ensures that any promise arguments
     * are settled and passed as values (`this` is also settled and passed
     * as a value).  It will also ensure that the result of a function is
     * always a promise.
     *
     * @example
     * var add = Q.promised(function (a, b) {
     *     return a + b;
     * });
     * add(Q(a), Q(B));
     *
     * @param {function} callback The function to decorate
     * @returns {function} a function that has been decorated.
     */
    Q.promised = promised;
    function promised(callback) {
        return function () {
            return spread([this, all(arguments)], function (self, args) {
                return callback.apply(self, args);
            });
        };
    }
    /**
     * sends a message to a value in a future turn
     * @param object* the recipient
     * @param op the name of the message operation, e.g., "when",
     * @param args further arguments to be forwarded to the operation
     * @returns result {Promise} a promise for the result of the operation
     */
    Q.dispatch = dispatch;
    function dispatch(object, op, args) {
        return Q(object).dispatch(op, args);
    }
    Promise.prototype.dispatch = function (op, args) {
        var self = this;
        var deferred = defer();
        Q.nextTick(function () {
            self.promiseDispatch(deferred.resolve, op, args);
        });
        return deferred.promise;
    };
    /**
     * Gets the value of a property in a future turn.
     * @param object    promise or immediate reference for target object
     * @param name      name of property to get
     * @return promise for the property value
     */
    Q.get = function (object, key) {
        return Q(object).dispatch("get", [key]);
    };
    Promise.prototype.get = function (key) {
        return this.dispatch("get", [key]);
    };
    /**
     * Sets the value of a property in a future turn.
     * @param object    promise or immediate reference for object object
     * @param name      name of property to set
     * @param value     new value of property
     * @return promise for the return value
     */
    Q.set = function (object, key, value) {
        return Q(object).dispatch("set", [key, value]);
    };
    Promise.prototype.set = function (key, value) {
        return this.dispatch("set", [key, value]);
    };
    /**
     * Deletes a property in a future turn.
     * @param object    promise or immediate reference for target object
     * @param name      name of property to delete
     * @return promise for the return value
     */
    Q.del =
        Q["delete"] = function (object, key) {
            return Q(object).dispatch("delete", [key]);
        };
    Promise.prototype.del =
        Promise.prototype["delete"] = function (key) {
            return this.dispatch("delete", [key]);
        };
    /**
     * Invokes a method in a future turn.
     * @param object    promise or immediate reference for target object
     * @param name      name of method to invoke
     * @param value     a value to post, typically an array of
     *                  invocation arguments for promises that
     *                  are ultimately backed with `resolve` values,
     *                  as opposed to those backed with URLs
     *                  wherein the posted value can be any
     *                  JSON serializable object.
     * @return promise for the return value
     */
    // bound locally because it is used by other methods
    Q.mapply =
        Q.post = function (object, name, args) {
            return Q(object).dispatch("post", [name, args]);
        };
    Promise.prototype.mapply =
        Promise.prototype.post = function (name, args) {
            return this.dispatch("post", [name, args]);
        };
    /**
     * Invokes a method in a future turn.
     * @param object    promise or immediate reference for target object
     * @param name      name of method to invoke
     * @param ...args   array of invocation arguments
     * @return promise for the return value
     */
    Q.send =
        Q.mcall =
            Q.invoke = function (object, name /*...args*/) {
                return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
            };
    Promise.prototype.send =
        Promise.prototype.mcall =
            Promise.prototype.invoke = function (name /*...args*/) {
                return this.dispatch("post", [name, array_slice(arguments, 1)]);
            };
    /**
     * Applies the promised function in a future turn.
     * @param object    promise or immediate reference for target function
     * @param args      array of application arguments
     */
    Q.fapply = function (object, args) {
        return Q(object).dispatch("apply", [void 0, args]);
    };
    Promise.prototype.fapply = function (args) {
        return this.dispatch("apply", [void 0, args]);
    };
    /**
     * Calls the promised function in a future turn.
     * @param object    promise or immediate reference for target function
     * @param ...args   array of application arguments
     */
    Q["try"] =
        Q.fcall = function (object /* ...args*/) {
            return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
        };
    Promise.prototype.fcall = function () {
        return this.dispatch("apply", [void 0, array_slice(arguments)]);
    };
    /**
     * Binds the promised function, transforming return values into a fulfilled
     * promise and thrown errors into a rejected one.
     * @param object    promise or immediate reference for target function
     * @param ...args   array of application arguments
     */
    Q.fbind = function (object /*...args*/) {
        var promise = Q(object);
        var args = array_slice(arguments, 1);
        return function fbound() {
            return promise.dispatch("apply", [
                this,
                args.concat(array_slice(arguments))
            ]);
        };
    };
    Promise.prototype.fbind = function () {
        var promise = this;
        var args = array_slice(arguments);
        return function fbound() {
            return promise.dispatch("apply", [
                this,
                args.concat(array_slice(arguments))
            ]);
        };
    };
    /**
     * Requests the names of the owned properties of a promised
     * object in a future turn.
     * @param object    promise or immediate reference for target object
     * @return promise for the keys of the eventually settled object
     */
    Q.keys = function (object) {
        return Q(object).dispatch("keys", []);
    };
    Promise.prototype.keys = function () {
        return this.dispatch("keys", []);
    };
    /**
     * Turns an array of promises into a promise for an array.  If any of
     * the promises gets rejected, the whole array is rejected immediately.
     * @param {Array*} an array (or promise for an array) of values (or
     * promises for values)
     * @returns a promise for an array of the corresponding values
     */
    // By Mark Miller
    // http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
    Q.all = all;
    function all(promises) {
        return when(promises, function (promises) {
            var pendingCount = 0;
            var deferred = defer();
            array_reduce(promises, function (undefined, promise, index) {
                var snapshot;
                if (isPromise(promise) &&
                    (snapshot = promise.inspect()).state === "fulfilled") {
                    promises[index] = snapshot.value;
                }
                else {
                    ++pendingCount;
                    when(promise, function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    }, deferred.reject, function (progress) {
                        deferred.notify({ index: index, value: progress });
                    });
                }
            }, void 0);
            if (pendingCount === 0) {
                deferred.resolve(promises);
            }
            return deferred.promise;
        });
    }
    Promise.prototype.all = function () {
        return all(this);
    };
    /**
     * Returns the first resolved promise of an array. Prior rejected promises are
     * ignored.  Rejects only if all promises are rejected.
     * @param {Array*} an array containing values or promises for values
     * @returns a promise fulfilled with the value of the first resolved promise,
     * or a rejected promise if all promises are rejected.
     */
    Q.any = any;
    function any(promises) {
        if (promises.length === 0) {
            return Q.resolve();
        }
        var deferred = Q.defer();
        var pendingCount = 0;
        array_reduce(promises, function (prev, current, index) {
            var promise = promises[index];
            pendingCount++;
            when(promise, onFulfilled, onRejected, onProgress);
            function onFulfilled(result) {
                deferred.resolve(result);
            }
            function onRejected(err) {
                pendingCount--;
                if (pendingCount === 0) {
                    err.message = ("Q can't get fulfillment value from any promise, all " +
                        "promises were rejected. Last error message: " + err.message);
                    deferred.reject(err);
                }
            }
            function onProgress(progress) {
                deferred.notify({
                    index: index,
                    value: progress
                });
            }
        }, undefined);
        return deferred.promise;
    }
    Promise.prototype.any = function () {
        return any(this);
    };
    /**
     * Waits for all promises to be settled, either fulfilled or
     * rejected.  This is distinct from `all` since that would stop
     * waiting at the first rejection.  The promise returned by
     * `allResolved` will never be rejected.
     * @param promises a promise for an array (or an array) of promises
     * (or values)
     * @return a promise for an array of promises
     */
    Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
    function allResolved(promises) {
        return when(promises, function (promises) {
            promises = array_map(promises, Q);
            return when(all(array_map(promises, function (promise) {
                return when(promise, noop, noop);
            })), function () {
                return promises;
            });
        });
    }
    Promise.prototype.allResolved = function () {
        return allResolved(this);
    };
    /**
     * @see Promise#allSettled
     */
    Q.allSettled = allSettled;
    function allSettled(promises) {
        return Q(promises).allSettled();
    }
    /**
     * Turns an array of promises into a promise for an array of their states (as
     * returned by `inspect`) when they have all settled.
     * @param {Array[Any*]} values an array (or promise for an array) of values (or
     * promises for values)
     * @returns {Array[State]} an array of states for the respective values.
     */
    Promise.prototype.allSettled = function () {
        return this.then(function (promises) {
            return all(array_map(promises, function (promise) {
                promise = Q(promise);
                function regardless() {
                    return promise.inspect();
                }
                return promise.then(regardless, regardless);
            }));
        });
    };
    /**
     * Captures the failure of a promise, giving an oportunity to recover
     * with a callback.  If the given promise is fulfilled, the returned
     * promise is fulfilled.
     * @param {Any*} promise for something
     * @param {Function} callback to fulfill the returned promise if the
     * given promise is rejected
     * @returns a promise for the return value of the callback
     */
    Q.fail =
        Q["catch"] = function (object, rejected) {
            return Q(object).then(void 0, rejected);
        };
    Promise.prototype.fail =
        Promise.prototype["catch"] = function (rejected) {
            return this.then(void 0, rejected);
        };
    /**
     * Attaches a listener that can respond to progress notifications from a
     * promise's originating deferred. This listener receives the exact arguments
     * passed to ``deferred.notify``.
     * @param {Any*} promise for something
     * @param {Function} callback to receive any progress notifications
     * @returns the given promise, unchanged
     */
    Q.progress = progress;
    function progress(object, progressed) {
        return Q(object).then(void 0, void 0, progressed);
    }
    Promise.prototype.progress = function (progressed) {
        return this.then(void 0, void 0, progressed);
    };
    /**
     * Provides an opportunity to observe the settling of a promise,
     * regardless of whether the promise is fulfilled or rejected.  Forwards
     * the resolution to the returned promise when the callback is done.
     * The callback can return a promise to defer completion.
     * @param {Any*} promise
     * @param {Function} callback to observe the resolution of the given
     * promise, takes no arguments.
     * @returns a promise for the resolution of the given promise when
     * ``fin`` is done.
     */
    Q.fin =
        Q["finally"] = function (object, callback) {
            return Q(object)["finally"](callback);
        };
    Promise.prototype.fin =
        Promise.prototype["finally"] = function (callback) {
            if (!callback || typeof callback.apply !== "function") {
                throw new Error("Q can't apply finally callback");
            }
            callback = Q(callback);
            return this.then(function (value) {
                return callback.fcall().then(function () {
                    return value;
                });
            }, function (reason) {
                // TODO attempt to recycle the rejection with "this".
                return callback.fcall().then(function () {
                    throw reason;
                });
            });
        };
    /**
     * Terminates a chain of promises, forcing rejections to be
     * thrown as exceptions.
     * @param {Any*} promise at the end of a chain of promises
     * @returns nothing
     */
    Q.done = function (object, fulfilled, rejected, progress) {
        return Q(object).done(fulfilled, rejected, progress);
    };
    Promise.prototype.done = function (fulfilled, rejected, progress) {
        var onUnhandledError = function (error) {
            // forward to a future turn so that ``when``
            // does not catch it and turn it into a rejection.
            Q.nextTick(function () {
                makeStackTraceLong(error, promise);
                if (Q.onerror) {
                    Q.onerror(error);
                }
                else {
                    throw error;
                }
            });
        };
        // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
        var promise = fulfilled || rejected || progress ?
            this.then(fulfilled, rejected, progress) :
            this;
        if (typeof process === "object" && process && process.domain) {
            onUnhandledError = process.domain.bind(onUnhandledError);
        }
        promise.then(void 0, onUnhandledError);
    };
    /**
     * Causes a promise to be rejected if it does not get fulfilled before
     * some milliseconds time out.
     * @param {Any*} promise
     * @param {Number} milliseconds timeout
     * @param {Any*} custom error message or Error object (optional)
     * @returns a promise for the resolution of the given promise if it is
     * fulfilled before the timeout, otherwise rejected.
     */
    Q.timeout = function (object, ms, error) {
        return Q(object).timeout(ms, error);
    };
    Promise.prototype.timeout = function (ms, error) {
        var deferred = defer();
        var timeoutId = setTimeout(function () {
            if (!error || "string" === typeof error) {
                error = new Error(error || "Timed out after " + ms + " ms");
                error.code = "ETIMEDOUT";
            }
            deferred.reject(error);
        }, ms);
        this.then(function (value) {
            clearTimeout(timeoutId);
            deferred.resolve(value);
        }, function (exception) {
            clearTimeout(timeoutId);
            deferred.reject(exception);
        }, deferred.notify);
        return deferred.promise;
    };
    /**
     * Returns a promise for the given value (or promised value), some
     * milliseconds after it resolved. Passes rejections immediately.
     * @param {Any*} promise
     * @param {Number} milliseconds
     * @returns a promise for the resolution of the given promise after milliseconds
     * time has elapsed since the resolution of the given promise.
     * If the given promise rejects, that is passed immediately.
     */
    Q.delay = function (object, timeout) {
        if (timeout === void 0) {
            timeout = object;
            object = void 0;
        }
        return Q(object).delay(timeout);
    };
    Promise.prototype.delay = function (timeout) {
        return this.then(function (value) {
            var deferred = defer();
            setTimeout(function () {
                deferred.resolve(value);
            }, timeout);
            return deferred.promise;
        });
    };
    /**
     * Passes a continuation to a Node function, which is called with the given
     * arguments provided as an array, and returns a promise.
     *
     *      Q.nfapply(FS.readFile, [__filename])
     *      .then(function (content) {
     *      })
     *
     */
    Q.nfapply = function (callback, args) {
        return Q(callback).nfapply(args);
    };
    Promise.prototype.nfapply = function (args) {
        var deferred = defer();
        var nodeArgs = array_slice(args);
        nodeArgs.push(deferred.makeNodeResolver());
        this.fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
    /**
     * Passes a continuation to a Node function, which is called with the given
     * arguments provided individually, and returns a promise.
     * @example
     * Q.nfcall(FS.readFile, __filename)
     * .then(function (content) {
     * })
     *
     */
    Q.nfcall = function (callback /*...args*/) {
        var args = array_slice(arguments, 1);
        return Q(callback).nfapply(args);
    };
    Promise.prototype.nfcall = function () {
        var nodeArgs = array_slice(arguments);
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        this.fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
    /**
     * Wraps a NodeJS continuation passing function and returns an equivalent
     * version that returns a promise.
     * @example
     * Q.nfbind(FS.readFile, __filename)("utf-8")
     * .then(console.log)
     * .done()
     */
    Q.nfbind =
        Q.denodeify = function (callback /*...args*/) {
            if (callback === undefined) {
                throw new Error("Q can't wrap an undefined function");
            }
            var baseArgs = array_slice(arguments, 1);
            return function () {
                var nodeArgs = baseArgs.concat(array_slice(arguments));
                var deferred = defer();
                nodeArgs.push(deferred.makeNodeResolver());
                Q(callback).fapply(nodeArgs).fail(deferred.reject);
                return deferred.promise;
            };
        };
    Promise.prototype.nfbind =
        Promise.prototype.denodeify = function () {
            var args = array_slice(arguments);
            args.unshift(this);
            return Q.denodeify.apply(void 0, args);
        };
    Q.nbind = function (callback, thisp /*...args*/) {
        var baseArgs = array_slice(arguments, 2);
        return function () {
            var nodeArgs = baseArgs.concat(array_slice(arguments));
            var deferred = defer();
            nodeArgs.push(deferred.makeNodeResolver());
            function bound() {
                return callback.apply(thisp, arguments);
            }
            Q(bound).fapply(nodeArgs).fail(deferred.reject);
            return deferred.promise;
        };
    };
    Promise.prototype.nbind = function () {
        var args = array_slice(arguments, 0);
        args.unshift(this);
        return Q.nbind.apply(void 0, args);
    };
    /**
     * Calls a method of a Node-style object that accepts a Node-style
     * callback with a given array of arguments, plus a provided callback.
     * @param object an object that has the named method
     * @param {String} name name of the method of object
     * @param {Array} args arguments to pass to the method; the callback
     * will be provided by Q and appended to these arguments.
     * @returns a promise for the value or error
     */
    Q.nmapply =
        Q.npost = function (object, name, args) {
            return Q(object).npost(name, args);
        };
    Promise.prototype.nmapply =
        Promise.prototype.npost = function (name, args) {
            var nodeArgs = array_slice(args || []);
            var deferred = defer();
            nodeArgs.push(deferred.makeNodeResolver());
            this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
            return deferred.promise;
        };
    /**
     * Calls a method of a Node-style object that accepts a Node-style
     * callback, forwarding the given variadic arguments, plus a provided
     * callback argument.
     * @param object an object that has the named method
     * @param {String} name name of the method of object
     * @param ...args arguments to pass to the method; the callback will
     * be provided by Q and appended to these arguments.
     * @returns a promise for the value or error
     */
    Q.nsend =
        Q.nmcall =
            Q.ninvoke = function (object, name /*...args*/) {
                var nodeArgs = array_slice(arguments, 2);
                var deferred = defer();
                nodeArgs.push(deferred.makeNodeResolver());
                Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
                return deferred.promise;
            };
    Promise.prototype.nsend =
        Promise.prototype.nmcall =
            Promise.prototype.ninvoke = function (name /*...args*/) {
                var nodeArgs = array_slice(arguments, 1);
                var deferred = defer();
                nodeArgs.push(deferred.makeNodeResolver());
                this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
                return deferred.promise;
            };
    /**
     * If a function would like to support both Node continuation-passing-style and
     * promise-returning-style, it can end its internal promise chain with
     * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
     * elects to use a nodeback, the result will be sent there.  If they do not
     * pass a nodeback, they will receive the result promise.
     * @param object a result (or a promise for a result)
     * @param {Function} nodeback a Node.js-style callback
     * @returns either the promise or nothing
     */
    Q.nodeify = nodeify;
    function nodeify(object, nodeback) {
        return Q(object).nodeify(nodeback);
    }
    Promise.prototype.nodeify = function (nodeback) {
        if (nodeback) {
            this.then(function (value) {
                Q.nextTick(function () {
                    nodeback(null, value);
                });
            }, function (error) {
                Q.nextTick(function () {
                    nodeback(error);
                });
            });
        }
        else {
            return this;
        }
    };
    Q.noConflict = function () {
        throw new Error("Q.noConflict only works when Q is used as a global");
    };
    // All code before this point will be filtered from stack traces.
    var qEndingLine = captureLine();
    return Q;
});
var _r;
(function (_r) {
    _r.overrides = [];
    function override(properties, callback) {
        properties.forEach(function (property) {
            _r.overrides[property] = callback;
        });
    }
    _r.override = override;
    function extend() {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        var target = params[0];
        for (var i = 1; i < params.length; i++) {
            var nextSource = params[i];
            Object.getOwnPropertyNames(nextSource).forEach(function (key) {
                if (_r.overrides[key]) {
                    var res = _r.overrides[key](target, nextSource, key);
                    if (res) {
                        target = res;
                    }
                }
                else {
                    if (key.indexOf('::') != -1) {
                        var split = key.split('::');
                        var res = _r[split[0]][split[1]](nextSource[key]);
                        if (res) {
                            target = res;
                        }
                    }
                    else {
                        if (_r.is.PlainObject(nextSource[key])) {
                            if (target[key] == null) {
                                target[key] = {};
                            }
                            target[key] = extend(target[key], nextSource[key]);
                        }
                        else {
                            if (target[key] != null && _r.is.Color(target[key]) && _r.is.HexColor(nextSource[key])) {
                                target[key] = BABYLON.Color3.FromHexString(nextSource[key]);
                            }
                            else {
                                if (_r.is.Function(nextSource[key])) {
                                    target[key] = nextSource[key].call(target, key);
                                }
                                else {
                                    target[key] = nextSource[key];
                                }
                            }
                        }
                    }
                }
            });
        }
        return target;
    }
    _r.extend = extend;
    function merge(target, source, excluded) {
        var others = {};
        Object.getOwnPropertyNames(source).forEach(function (property) {
            if (!excluded || excluded.indexOf(property) == -1) {
                others[property] = source[property];
            }
        });
        _r.extend(target, others);
        return target;
    }
    _r.merge = merge;
    function patch() {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        if (params.length == 1) {
            params[0].forEach(function (_patch) {
                var selector = Object.getOwnPropertyNames(_patch)[0];
                if (selector.indexOf('::') != -1) {
                    var split = selector.split('::');
                    _r[split[0]][split[1]](_patch[selector]);
                }
                else {
                    _r.select(selector).each(function (element) {
                        _r.extend(element, _patch[selector]);
                    });
                }
            });
        }
        else {
            var nodes = params[0];
            var patch = params[1];
            var el = new _r.Elements(nodes);
            el.each(function (obj) {
                console.info("patch", obj.name, patch);
                _r.extend(obj, patch);
            });
            return el;
        }
    }
    _r.patch = patch;
})(_r || (_r = {}));
var _r;
(function (_r) {
    /** Overrides **/
    _r.override([
        'NothingTrigger ',
        'OnPickTrigger',
        'OnLeftPickTrigger',
        'OnRightPickTrigger',
        'OnCenterPickTrigger',
        'OnPickDownTrigger',
        'OnPickUpTrigger',
        'OnPickOutTrigger',
        'OnLongPressTrigger',
        'OnPointerOverTrigger',
        'OnPointerOutTrigger',
        'OnEveryFrameTrigger',
        'OnIntersectionEnterTrigger',
        'OnIntersectionExitTrigger',
        'OnKeyDownTrigger',
        'OnKeyUpTrigger'
    ], function (target, source, property) {
        _r.select(target).on(property, source[property]);
    });
    _r.override(["diffuseFresnelParameters", "opacityFresnelParameters", "emissiveFresnelParameters", "refractionFresnelParameters", "reflectionFresnelParameters"], function (target, source, property) {
        var configuration = source[property];
        if (!target[property]) {
            target[property] = new BABYLON.FresnelParameters();
        }
        _r.extend(target[property], configuration);
    });
    _r.override(["includedOnlyMeshes", "excludedMeshes"], function (target, source, property) {
        if (_r.is.Array(source[property])) {
            target[property] = _r.select(source[property].join(',')).toArray();
        }
        else {
            if (_r.is.String(source[property])) {
                target[property] = _r.select(source[property]).toArray();
            }
            else {
                target[property] = eval(source[property]);
            }
        }
    });
    _r.override(["LUT", "ColorCorrectionPostProcess"], function (target, source, property) {
        if (target instanceof BABYLON.Camera) {
            new BABYLON.ColorCorrectionPostProcess("color_correction", source[property], 1.0, target, null, _r.engine, true);
        }
        else {
            console.error("BABYLON.Runtime::" + property + " is only supported for BABYLON.Camera");
        }
    });
    /** Helpers **/
    function color() {
        var parameters = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            parameters[_i] = arguments[_i];
        }
        if (parameters.length == 1) {
            return BABYLON.Color3.FromHexString(parameters[0]);
        }
        else {
            if (parameters.length == 3) {
                return new BABYLON.Color3(parameters[0], parameters[1], parameters[2]);
            }
            else {
                if (parameters.length == 4) {
                    return new BABYLON.Color4(parameters[0], parameters[1], parameters[2], parameters[3]);
                }
                else {
                    console.error('_r.color() cannot be parsed');
                    return BABYLON.Color3.Black();
                }
            }
        }
    }
    _r.color = color;
    function showDebug() {
        _r.scene.debugLayer.show();
    }
    _r.showDebug = showDebug;
    function hideDebug() {
        _r.scene.debugLayer.hide();
    }
    _r.hideDebug = hideDebug;
})(_r || (_r = {}));
/**
 *
 * # Examples
 * ## 2 seconds animation
 * ```js
 * _r.animate([
 *      {
 *          'mesh.000' : {
 *              position : {
 *                  x : 10
 *          }
 *      },
 *      {
 *          'mesh.001' : {
 *              position : {
 *                  y : 10
 *              }
 *          }
 *      }
 * }, 5)
 *
 * _r.animate('mesh.000', {
 *      position : {
 *          x : 10
 *      }
 * }, 2)
 * ```
 *
 * ## Easing with [easings](http://easings.net "easings.net")
 * ```js
 * _r.animations.animate('mesh.000', {
 *      position : {
 *          x : 10
 *      }
 * }, {
 *      duration : 2,
 *      easing : "easeOutQuint"
 * })
 * ```
 * @see {@link IAnimationOption}
 * ## Shortcuts
 * ### On elements
 * ```js
 * _r("mesh.*").animate(position : {
 *          x : 10
 * }, 2)
 * ```
 *
 *
 */
var _r;
(function (_r) {
    var animations;
    (function (animations) {
        function guessAnimationType(element, property) {
            if (_r.is.Vector2(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_VECTOR2;
            }
            if (_r.is.Vector3(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_VECTOR3;
            }
            if (_r.is.Number(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_FLOAT;
            }
            if (_r.is.Color(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_COLOR3;
            }
            if (_r.is.Quaternion(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_QUATERNION;
            }
            if (_r.is.Matrix(element[property])) {
                return BABYLON.Animation.ANIMATIONTYPE_MATRIX;
            }
            return null;
        }
        // map http://easings.net/fr to Babylon
        function getEasing(easing) {
            var mode;
            var func;
            if (easing.indexOf("easeInOut") != -1) {
                mode = BABYLON.EasingFunction.EASINGMODE_EASEINOUT;
                func = easing.replace("easeInOut", "");
            }
            else {
                if (easing.indexOf("easeIn") != -1) {
                    mode = BABYLON.EasingFunction.EASINGMODE_EASEIN;
                    func = easing.replace("easeIn", "");
                }
                else {
                    if (easing.indexOf("easeOut") != -1) {
                        mode = BABYLON.EasingFunction.EASINGMODE_EASEOUT;
                        func = easing.replace("easeOut", "");
                    }
                    else {
                        console.info("_r::unrecognized easing function " + easing);
                        return null;
                    }
                }
            }
            var easingFunction;
            switch (func) {
                case "Sine":
                    easingFunction = new BABYLON.SineEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Quad":
                    easingFunction = new BABYLON.QuadraticEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Cubic":
                    easingFunction = new BABYLON.CubicEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Quart":
                    easingFunction = new BABYLON.QuarticEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Quint":
                    easingFunction = new BABYLON.QuinticEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Expo":
                    easingFunction = new BABYLON.ExponentialEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Circ":
                    easingFunction = new BABYLON.CircleEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Back":
                    easingFunction = new BABYLON.BackEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Elastic":
                    easingFunction = new BABYLON.ElasticEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                case "Bounce":
                    easingFunction = new BABYLON.BounceEase();
                    easingFunction.setEasingMode(mode);
                    return easingFunction;
                default:
                    console.warn("_r::unrecognized easing function " + easing);
                    return null;
            }
        }
        animations.getEasing = getEasing;
        var animateOptions = {
            duration: 2,
            fps: 25,
            easing: null,
            speedRatio: 1,
            onAnimationEnd: null,
            keys: null,
            from: 0,
            to: null,
            loop: false
        };
        function getAnimationOptions(options) {
            if (!options) {
                return animateOptions;
            }
            var _options;
            if (_r.is.Number(options)) {
                _options = {
                    "duration": options
                };
            }
            else {
                _options = options;
            }
            for (var property in animateOptions) {
                if (!_options[property]) {
                    _options[property] = animateOptions[property];
                }
            }
            return _options;
        }
        function animate(nodes, properties, options) {
            var elements = new _r.Elements(nodes);
            var _options = getAnimationOptions(options);
            var to = _options.to ? _options.to : _options.duration * _options.fps;
            var from = _options.from ? _options.from : 0;
            elements.each(function (element) {
                if (!element.animations) {
                    element.animations = [];
                }
                var value, name = _options.name || "animation" + element.animations.length;
                Object.getOwnPropertyNames(properties).forEach(function (property) {
                    var propertyPath = property.split('.');
                    var startValue = element[propertyPath[0]];
                    if (propertyPath.length > 1) {
                        for (var i = 1; i < propertyPath.length; i++) {
                            startValue = startValue[propertyPath[i]];
                        }
                    }
                    var endValue = properties[property];
                    var animationType = guessAnimationType(element, property) || BABYLON.Animation.ANIMATIONTYPE_FLOAT;
                    if (_r.is.PlainObject(properties[property])) {
                        endValue = _r.extend({}, element[property]);
                        Object.getOwnPropertyNames(properties[property]).forEach(function (prop) {
                            endValue[prop] = properties[property][prop];
                        });
                        if (animationType == BABYLON.Animation.ANIMATIONTYPE_COLOR3) {
                            endValue = new BABYLON.Color3(endValue[0], endValue[1], endValue[2]);
                        }
                    }
                    var animation = new BABYLON.Animation(name, property, _options.fps, animationType, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
                    var keys;
                    if (_options.keys) {
                        keys = _options.keys;
                    }
                    else {
                        keys = [];
                        keys.push({
                            frame: from,
                            value: startValue
                        });
                        keys.push({
                            frame: to,
                            value: endValue
                        });
                    }
                    animation.setKeys(keys);
                    if (_options.easing) {
                        var easingFunction = getEasing(_options.easing);
                        if (easingFunction) {
                            animation.setEasingFunction(easingFunction);
                        }
                    }
                    element.animations.push(animation);
                });
                _r.trigger(element, "onAnimationStart");
                _r.scene.beginAnimation(element, from, to, _options.loop, _options.speedRatio, function () {
                    if (_options.onAnimationEnd) {
                        _options.onAnimationEnd.call(element);
                    }
                    _r.trigger(element, "onAnimationEnd");
                });
            });
            return elements;
        }
        animations.animate = animate;
    })(animations = _r.animations || (_r.animations = {}));
})(_r || (_r = {}));
(function (_r) {
    function animate() {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        if (params.length == 2) {
            if (_r.is.String(params[0])) {
                _r.animations.animate(params[0], params[1]);
            }
            else {
                if (_r.is.Array(params[0])) {
                    params[0].forEach(function (param) {
                        _r.animate(param, params[1]);
                    });
                }
                else {
                    Object.getOwnPropertyNames(params[0]).forEach(function (param) {
                        _r.animations.animate(param, params[0][param], params[1]);
                    });
                }
            }
        }
        else {
            if (params.length == 3) {
                _r.animations.animate(params[0], params[1], params[2]);
            }
            else {
                console.error("_r.animate required 2 or 3 arguments, not " + params.length);
            }
        }
    }
    _r.animate = animate;
})(_r || (_r = {}));
var _r;
(function (_r) {
    var camera;
    (function (camera_1) {
        var name;
        var eventPrefix = BABYLON.Tools.GetPointerPrefix();
        var PanCameraPointersInput = (function () {
            function PanCameraPointersInput() {
                this.buttons = [0, 1, 2];
                this.angularSensibilityX = 1000.0;
                this.angularSensibilityY = 1000.0;
                this.pinchPrecision = 6.0;
                this.panningSensibility = 50.0;
                this._isPanClick = true;
                this.pinchInwards = true;
            }
            PanCameraPointersInput.prototype.attachControl = function (element, noPreventDefault) {
                var _this = this;
                var engine = this.camera.getEngine();
                var cacheSoloPointer; // cache pointer object for better perf on camera rotation
                var pointA, pointB;
                var previousPinchDistance = 0;
                this._pointerInput = function (p, s) {
                    var evt = p.event;
                    if (p.type !== BABYLON.PointerEventTypes.POINTERMOVE && _this.buttons.indexOf(evt.button) === -1) {
                        return;
                    }
                    if (p.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                        try {
                            evt.srcElement.setPointerCapture(evt.pointerId);
                        }
                        catch (e) {
                            //Nothing to do with the error. Execution will continue.
                        }
                        // Manage panning with pan button click
                        //this._isPanClick = evt.button === this.camera._panningMouseButton;
                        _this._isPanClick = true;
                        // manage pointers
                        cacheSoloPointer = { x: evt.clientX, y: evt.clientY, pointerId: evt.pointerId, type: evt.pointerType };
                        if (pointA === undefined) {
                            pointA = cacheSoloPointer;
                        }
                        else if (pointB === undefined) {
                            pointB = cacheSoloPointer;
                        }
                        if (!noPreventDefault) {
                            evt.preventDefault();
                            element.focus();
                        }
                    }
                    else if (p.type === BABYLON.PointerEventTypes.POINTERUP) {
                        try {
                            evt.srcElement.releasePointerCapture(evt.pointerId);
                        }
                        catch (e) {
                            //Nothing to do with the error.
                        }
                        cacheSoloPointer = null;
                        previousPinchDistance = 0;
                        //would be better to use pointers.remove(evt.pointerId) for multitouch gestures,
                        //but emptying completly pointers collection is required to fix a bug on iPhone :
                        //when changing orientation while pinching camera, one pointer stay pressed forever if we don't release all pointers
                        //will be ok to put back pointers.remove(evt.pointerId); when iPhone bug corrected
                        pointA = pointB = undefined;
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                    else if (p.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                        // One button down
                        if (pointA && pointB === undefined) {
                            if (_this.panningSensibility !== 0 &&
                                ((_this.camera._useCtrlForPanning) ||
                                    (!_this.camera._useCtrlForPanning && _this._isPanClick))) {
                                _this.camera
                                    .inertialPanningX += -(evt.clientX - cacheSoloPointer.x) / _this.panningSensibility;
                                _this.camera
                                    .inertialPanningY += (evt.clientY - cacheSoloPointer.y) / _this.panningSensibility;
                            }
                            else {
                                var offsetX = evt.clientX - cacheSoloPointer.x;
                                var offsetY = evt.clientY - cacheSoloPointer.y;
                                _this.camera.inertialAlphaOffset -= offsetX / _this.angularSensibilityX;
                                _this.camera.inertialBetaOffset -= offsetY / _this.angularSensibilityY;
                            }
                            cacheSoloPointer.x = evt.clientX;
                            cacheSoloPointer.y = evt.clientY;
                        }
                        else if (pointA && pointB) {
                            //if (noPreventDefault) { evt.preventDefault(); } //if pinch gesture, could be useful to force preventDefault to avoid html page scroll/zoom in some mobile browsers
                            var ed = (pointA.pointerId === evt.pointerId) ? pointA : pointB;
                            ed.x = evt.clientX;
                            ed.y = evt.clientY;
                            var direction = _this.pinchInwards ? 1 : -1;
                            var distX = pointA.x - pointB.x;
                            var distY = pointA.y - pointB.y;
                            var pinchSquaredDistance = (distX * distX) + (distY * distY);
                            if (previousPinchDistance === 0) {
                                previousPinchDistance = pinchSquaredDistance;
                                return;
                            }
                            if (pinchSquaredDistance !== previousPinchDistance) {
                                _this.camera
                                    .inertialRadiusOffset += (pinchSquaredDistance - previousPinchDistance) /
                                    (_this.pinchPrecision *
                                        ((_this.angularSensibilityX + _this.angularSensibilityY) / 2) *
                                        direction);
                                previousPinchDistance = pinchSquaredDistance;
                            }
                        }
                    }
                };
                this._observer = this.camera.getScene().onPointerObservable.add(this._pointerInput, BABYLON.PointerEventTypes.POINTERDOWN | BABYLON.PointerEventTypes.POINTERUP | BABYLON.PointerEventTypes.POINTERMOVE);
                this._onContextMenu = function (evt) {
                    evt.preventDefault();
                };
                if (!this.camera._useCtrlForPanning) {
                    element.addEventListener("contextmenu", this._onContextMenu, false);
                }
                this._onLostFocus = function () {
                    //this._keys = [];
                    pointA = pointB = undefined;
                    previousPinchDistance = 0;
                    cacheSoloPointer = null;
                };
                this._onMouseMove = function (evt) {
                    if (!engine.isPointerLock) {
                        return;
                    }
                    var offsetX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || evt.msMovementX || 0;
                    var offsetY = evt.movementY || evt.mozMovementY || evt.webkitMovementY || evt.msMovementY || 0;
                    _this.camera.inertialAlphaOffset -= offsetX / _this.angularSensibilityX;
                    _this.camera.inertialBetaOffset -= offsetY / _this.angularSensibilityY;
                    if (!noPreventDefault) {
                        evt.preventDefault();
                    }
                };
                this._onGestureStart = function (e) {
                    if (window.MSGesture === undefined) {
                        return;
                    }
                    if (!_this._MSGestureHandler) {
                        _this._MSGestureHandler = new MSGesture();
                        _this._MSGestureHandler.target = element;
                    }
                    _this._MSGestureHandler.addPointer(e.pointerId);
                };
                this._onGesture = function (e) {
                    _this.camera.radius *= e.scale;
                    if (e.preventDefault) {
                        if (!noPreventDefault) {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    }
                };
                element.addEventListener("mousemove", this._onMouseMove, false);
                element.addEventListener("MSPointerDown", this._onGestureStart, false);
                element.addEventListener("MSGestureChange", this._onGesture, false);
                //element.addEventListener("keydown", this._onKeyDown, false);
                //element.addEventListener("keyup", this._onKeyUp, false);
                BABYLON.Tools.RegisterTopRootEvents([
                    { name: "blur", handler: this._onLostFocus }
                ]);
            };
            PanCameraPointersInput.prototype.detachControl = function (element) {
                if (element && this._observer) {
                    this.camera.getScene().onPointerObservable.remove(this._observer);
                    this._observer = null;
                    element.removeEventListener("contextmenu", this._onContextMenu);
                    element.removeEventListener("mousemove", this._onMouseMove);
                    element.removeEventListener("MSPointerDown", this._onGestureStart);
                    element.removeEventListener("MSGestureChange", this._onGesture);
                    element.removeEventListener("keydown", this._onKeyDown);
                    element.removeEventListener("keyup", this._onKeyUp);
                    this._isPanClick = true;
                    this.pinchInwards = true;
                    this._onKeyDown = null;
                    this._onKeyUp = null;
                    this._onMouseMove = null;
                    this._onGestureStart = null;
                    this._onGesture = null;
                    this._MSGestureHandler = null;
                    this._onLostFocus = null;
                    this._onContextMenu = null;
                }
                BABYLON.Tools.UnregisterTopRootEvents([
                    { name: "blur", handler: this._onLostFocus }
                ]);
            };
            PanCameraPointersInput.prototype.getTypeName = function () {
                return "ArcRotateCameraPointersInput";
            };
            PanCameraPointersInput.prototype.getSimpleName = function () {
                return "pointers";
            };
            return PanCameraPointersInput;
        }());
        function toPanCamera(camera) {
            camera = _r.select(camera)[0];
            camera.inputs.remove(camera.inputs.attached['pointers']);
            var panInputs = new PanCameraPointersInput();
            camera.inputs.add(panInputs);
            return camera;
        }
        camera_1.toPanCamera = toPanCamera;
        function isActive(camera) {
            if (_r.is.String(camera)) {
                return _r.scene.activeCamera.name == camera;
            }
            else {
                return _r.scene.activeCamera.name = camera.name;
            }
        }
        camera_1.isActive = isActive;
        function activate(camera) {
            var _camera = camera instanceof BABYLON.Camera ? camera : _r.scene.getCameraByName(camera);
            console.info('setActiveCamera : ' + _camera.name);
            if (_r.scene.activeCamera) {
                _r.scene.activeCamera.detachControl(_r.canvas);
                if (_r.scene.activeCamera.hasOwnProperty("OnDeactivate")) {
                    try {
                        _r.scene.activeCamera["OnDeactivate"].call(_r.scene.activeCamera);
                    }
                    catch (ex) {
                        console.error('_r::setActiveCamera::OnDeactivate', ex);
                    }
                }
            }
            if (_camera.hasOwnProperty("OnActivate")) {
                try {
                    _camera["OnActivate"].call(_camera);
                }
                catch (ex) {
                    console.error('_r::setActiveCamera::OnActivate', ex);
                }
            }
            _r.scene.activeCamera = _camera;
            _r.scene.activeCamera.attachControl(_r.canvas);
        }
        camera_1.activate = activate;
        _r.override(["OnActivate"], function (target, source, property) {
            target["OnActivate"] = source[property];
        });
        _r.override(["OnDeactivate"], function (target, source, property) {
            target["OnDeactivate"] = source[property];
        });
        function goTo(position, rotation, options) {
            if (options == false) {
                var activeCamera = _r.select(_r.scene.activeCamera)[0];
                activeCamera.position = position;
                activeCamera.rotation = rotation;
            }
            else {
                if (rotation) {
                    return _r.animate(_r.scene.activeCamera, {
                        position: position,
                        rotation: rotation
                    }, options);
                }
                else {
                    return _r.animate(_r.scene.activeCamera, {
                        position: position
                    }, options);
                }
            }
        }
        camera_1.goTo = goTo;
        function free(params) {
            if (params.position) {
                if (!_r.is.Vector3(params.position)) {
                    params.position = new BABYLON.Vector3(params.position['x'] ? params.position['x'] : 0, params.position['y'] ? params.position['y'] : 0, params.position['z'] ? params.position['z'] : 0);
                }
            }
            else {
                params.position = new BABYLON.Vector3(0, 0, 0);
            }
            var _camera = new BABYLON.FreeCamera(params.name, params.position, _r.scene);
            if (params.target) {
                if (!_r.is.Vector3(params.target)) {
                    params.target = new BABYLON.Vector3(params.target['x'] ? params.target['x'] : 0, params.target['y'] ? params.target['y'] : 0, params.target['z'] ? params.target['z'] : 0);
                }
                _camera.setTarget(params.target);
            }
            return _r.merge(_camera, params, ['name', 'position']);
        }
        camera_1.free = free;
        _r.override(['camera.free'], function (target, source, property) {
            return free(source[property]);
        });
        ;
        function arcrotate(params) {
            if (params.target) {
                if (!_r.is.Vector3(params.target)) {
                    params.target = new BABYLON.Vector3(params.target['x'] ? params.target['x'] : 0, params.target['y'] ? params.target['y'] : 0, params.target['z'] ? params.target['z'] : 0);
                }
                else {
                    params.target = new BABYLON.Vector3(0, 0, 0);
                }
            }
            var _camera = new BABYLON.ArcRotateCamera(params.name, params.alpha, params.beta, params.radius, params.target, _r.scene);
            return _r.merge(_camera, params, ['name', 'alpha', 'beta', 'radius', 'target']);
        }
        camera_1.arcrotate = arcrotate;
        ;
        _r.override(['camera.arcrotate'], function (target, source, property) {
            return arcrotate(source[property]);
        });
    })(camera = _r.camera || (_r.camera = {}));
})(_r || (_r = {}));
var _r;
(function (_r) {
    var _cache = [];
    var expando = '_r' + Date.now();
    /**
     * The .data() method allows us to attach data of any type to elements in a way that is safe from circular references and therefore from memory leaks.
     */
    function data(elements, key, value) {
        var el = new _r.Elements(elements);
        var result;
        el.each(function (_element) {
            if (!_element.hasOwnProperty(expando)) {
                _element[expando] = _cache.length;
                _cache[_element[expando]] = [];
            }
            if (key) {
                if (value) {
                    _cache[_element[expando]][key] = value;
                }
                else {
                    if (!_cache[_element[expando]][key]) {
                        _cache[_element[expando]][key] = {};
                    }
                    result = _cache[_element[expando]][key];
                    return false; // break the each.
                }
            }
            else {
                result = _cache[_element[expando]];
                return false; // break the each.
            }
        });
        if (result) {
            return result;
        }
        else {
            return el;
        }
    }
    _r.data = data;
    _r.override(['data'], function (target, source, property) {
        Object.getOwnPropertyNames(source[property]).forEach(function (key) {
            _r.select(target).data(key, source[property][key]);
        });
    });
})(_r || (_r = {}));
var _r;
(function (_r) {
    var debug;
    (function (debug) {
        debug.mode = "DEBUG";
        function log() {
            var options = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                options[_i] = arguments[_i];
            }
            if (debug.mode == "DEBUG" || debug.mode == "PROD") {
                console.log.call(options);
            }
        }
        debug.log = log;
        function info() {
            var options = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                options[_i] = arguments[_i];
            }
            if (debug.mode == "DEBUG" || debug.mode == "PROD") {
                console.info.call(options);
            }
        }
        debug.info = info;
        function warn() {
            var options = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                options[_i] = arguments[_i];
            }
            if (debug.mode == "DEBUG" || debug.mode == "PROD") {
                console.warn.call(options);
            }
        }
        debug.warn = warn;
        function error() {
            var options = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                options[_i] = arguments[_i];
            }
            if (debug.mode == "DEBUG" || debug.mode == "PROD") {
                console.error.call(options);
            }
        }
        debug.error = error;
    })(debug = _r.debug || (_r.debug = {}));
})(_r || (_r = {}));
var _r;
(function (_r) {
    var dragdrop;
    (function (dragdrop) {
        var DragDrop = (function () {
            function DragDrop(ground) {
                this.ground = ground;
                var scene = this.ground.getScene();
                var canvas = scene.getEngine().getRenderingCanvas();
                var self = this;
                var pointerdown = function (evt) {
                    self.onPointerDown.call(self, evt);
                };
                var pointerup = function (evt) {
                    self.onPointerUp.call(self, evt);
                };
                var pointermove = function (evt) {
                    self.onPointerMove.call(self, evt);
                };
                canvas.addEventListener("pointerdown", pointerdown, false);
                canvas.addEventListener("pointerup", pointerup, false);
                canvas.addEventListener("pointermove", pointermove, false);
                scene.onDispose = function () {
                    canvas.removeEventListener("pointerdown", pointerdown);
                    canvas.removeEventListener("pointerup", pointerup);
                    canvas.removeEventListener("pointermove", pointermove);
                };
            }
            DragDrop.prototype.getGroundPosition = function (evt) {
                var scene = this.ground.getScene();
                var ground = this.ground;
                var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
                if (pickinfo.hit) {
                    return pickinfo.pickedPoint;
                }
                return null;
            };
            DragDrop.prototype.onPointerDown = function (evt) {
                if (evt.button !== 0) {
                    return;
                }
                var scene = this.ground.getScene();
                // check if we are under a mesh
                var ground = this.ground;
                var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
                    return mesh['draggable'] && mesh !== ground;
                });
                if (pickInfo.hit) {
                    this.currentMesh = pickInfo.pickedMesh;
                    this.startingPoint = this.getGroundPosition(evt);
                    if (this.startingPoint) {
                        setTimeout(function () {
                            scene.activeCamera.detachControl(scene.getEngine().getRenderingCanvas());
                        }, 0);
                    }
                }
            };
            DragDrop.prototype.onPointerUp = function () {
                var scene = this.ground.getScene();
                if (this.startingPoint) {
                    scene.activeCamera.attachControl(scene.getEngine().getRenderingCanvas());
                    this.startingPoint = null;
                    return;
                }
            };
            DragDrop.prototype.onPointerMove = function (evt) {
                if (!this.startingPoint) {
                    return;
                }
                var current = this.getGroundPosition(evt);
                if (!current) {
                    return;
                }
                var diff = current.subtract(this.startingPoint);
                this.currentMesh.position.addInPlace(diff);
                this.startingPoint = current;
            };
            return DragDrop;
        }());
        _r.override(["dragAlongMesh"], function (target, source, property) {
            new DragDrop(_r.select(source[property])[0]);
        });
    })(dragdrop = _r.dragdrop || (_r.dragdrop = {}));
})(_r || (_r = {}));
var _r;
(function (_r) {
    var Elements = (function () {
        function Elements(params) {
            if (!params || params === '' || typeof params === 'string' && params.trim() === '') {
                this.length = 0;
                return;
            }
            if (typeof params === 'string') {
                var i = 0;
                var self = this;
                params.split(',').forEach(function (selector) {
                    selector = selector.trim();
                    var types = [];
                    if (selector.indexOf(':mesh') !== -1) {
                        selector = selector.replace(':mesh', '');
                        types.push("meshes");
                    }
                    if (selector.indexOf(':material') !== -1) {
                        selector = selector.replace(':material', '');
                        types.push("materials");
                    }
                    if (selector.indexOf(':light') !== -1) {
                        selector = selector.replace(':light', '');
                        types.push("lights");
                    }
                    if (selector.indexOf(':camera') !== -1) {
                        selector = selector.replace(':camera', '');
                        types.push("cameras");
                    }
                    if (selector.indexOf(':texture') !== -1) {
                        selector = selector.replace(':texture', '');
                        types.push("textures");
                    }
                    if (types.length == 0) {
                        types = ["meshes", "materials", "lights", "cameras", "textures"];
                    }
                    var attributes = [];
                    var regExpAttribute = /\[(.*?)\]/;
                    var matched = regExpAttribute.exec(selector);
                    if (matched) {
                        selector = selector.replace(matched[0], '');
                        var expr = matched[1];
                        var operator;
                        if (expr.indexOf('!=') != -1) {
                            operator = '!=';
                        }
                        else {
                            if (expr.indexOf('=') != -1) {
                                operator = '=';
                            }
                        }
                        if (operator) {
                            var split = expr.split(operator);
                            attributes.push({
                                'property': split[0],
                                'operator': operator,
                                'value': split[1].replace(/[""]/g, '')
                            });
                        }
                        else {
                            attributes.push({
                                'property': expr
                            });
                        }
                    }
                    ;
                    var exp = selector.replace(/\*/g, '.*'), regExp = new RegExp('^' + exp + '$'), scene = _r.scene;
                    if (selector == "scene") {
                        self[i++] = scene;
                    }
                    types.forEach(function (_type) {
                        scene[_type].forEach(function (_item) {
                            // TODO : name or ID ?
                            if (regExp.test(_item.name)) {
                                if (attributes.length > 0) {
                                    attributes.forEach(function (attribute) {
                                        if (attribute.hasOwnProperty('operator')) {
                                            if (_item.hasOwnProperty(attribute.property)) {
                                                switch (attribute.operator) {
                                                    case '=':
                                                        if (_item[attribute.property].toString() == attribute.value) {
                                                            self[i++] = _item;
                                                        }
                                                        break;
                                                    case '!=':
                                                        if (_item[attribute.property].toString() != attribute.value) {
                                                            self[i++] = _item;
                                                        }
                                                        break;
                                                    default:
                                                        console.warn('BABYLON.Runtime._r : unrecognized operator ' + attribute.operator);
                                                }
                                            }
                                        }
                                        else {
                                            if (_item.hasOwnProperty(attribute.property)) {
                                                self[i++] = _item;
                                            }
                                        }
                                    });
                                }
                                else {
                                    self[i++] = _item;
                                }
                            }
                        });
                    });
                    self.length = i;
                });
                if (this.length == 0) {
                    console.warn('BABYLON.Runtime::no object(s) found for selector "' + params + '"');
                }
            }
            else {
                if (params instanceof Elements) {
                    this.length = 0;
                    var self = this;
                    params.each(function (element) {
                        self[self.length++] = element;
                    });
                }
                else {
                    this[0] = params;
                    this.length = 1;
                }
            }
            // TODO : idea...WHAT IF ?
            // if(isMeshes || isCamera) -> rotate, move, etc.
            // if(isLights) ->
            // if(isScene) ->
            // if(isTextures) ->
        }
        Elements.prototype.patch = function (value) {
            return _r.patch(this, value);
        };
        Elements.prototype.data = function (key, value) {
            return _r.data(this, key, value);
        };
        Elements.prototype.log = function (property) {
            this.each(function (item) {
                if (property) {
                    console.log(item[property]);
                }
                else {
                    console.log(item);
                }
            });
            return this;
        };
        Elements.prototype.on = function (type, handler) {
            return _r.on(this, type, handler);
        };
        Elements.prototype.one = function (type, handler) {
            return _r.one(this, type, handler);
        };
        Elements.prototype.off = function (type, handler) {
            return _r.off(this, type, handler);
        };
        Elements.prototype.trigger = function (type, data) {
            return _r.trigger(this, type, data);
        };
        Elements.prototype.animate = function (properties, options) {
            return _r.animate(this, properties, options);
        };
        Elements.prototype.fadeOut = function (options) {
            return this.fadeTo(0, options);
        };
        Elements.prototype.fadeIn = function (options) {
            return this.fadeTo(1, options);
        };
        Elements.prototype.fadeTo = function (value, options) {
            return _r.animate(this, {
                visibility: value,
                alpha: value
            }, options);
        };
        Elements.prototype.stop = function (animationName) {
            this.each(function (element) {
                _r.scene.stopAnimation(element, animationName);
            });
            return this;
        };
        Elements.prototype.finish = function () {
        };
        Elements.prototype.each = function (callback) {
            for (var i = 0; i < this.length; i++) {
                /** We can break the .each() loop at a particular iteration by making the callback function return false. Returning non-false is the same as a continue statement in a for loop; it will skip immediately to the next iteration. **/
                if (callback.call(this[i], this[i], i) == false) {
                    return;
                }
            }
            return this;
        };
        Elements.prototype.map = function (func) {
            var result = new Elements();
            var length = 0;
            this.each(function (element) {
                result[length++] = func(element);
            });
            result.length = length;
            return result;
        };
        Elements.prototype.filter = function (func) {
            var result = new Elements();
            var length = 0;
            this.each(function (element) {
                if (func(element)) {
                    result[length++] = element;
                }
            });
            result.length = length;
            return result;
        };
        Elements.prototype.concat = function () {
            var elements = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                elements[_i] = arguments[_i];
            }
            var self = this;
            elements.forEach(function (element) {
                var base;
                // TODO : all of this should maybe being in the constructor....
                if (element instanceof Elements) {
                    base = element;
                }
                else {
                    if (_r.is.String(element)) {
                        base = new Elements(element);
                    }
                    else {
                        if (_r.is.Array(element)) {
                            base = new Elements();
                            element.forEach(function (item) {
                                base[base.length++] = item;
                            });
                        }
                        else {
                            base = new Elements(element);
                        }
                    }
                }
                base.each(function (item) {
                    self[self.length++] = item;
                });
            });
            return this;
        };
        Elements.prototype.toArray = function () {
            var result = [];
            for (var i = 0; i < this.length; i++) {
                result.push(this[i]);
            }
            return result;
        };
        Elements.prototype.attr = function (attribute, value) {
            if (value != null) {
                this.each(function (item) {
                    item[attribute] = value;
                });
                return this;
            }
            else {
                return this[0][attribute];
            }
        };
        /**
         * Reduce the set of matched elements to the first in the set.
         * @returns {any}
         */
        Elements.prototype.first = function () {
            return this[0];
        };
        /**
         * Reduce the set of matched elements to the one at the specified index.
         * @param index
         */
        Elements.prototype.eq = function (index) {
            return new Elements(this[index]);
        };
        Elements.prototype.get = function (index) {
            if (index) {
                return this[index];
            }
            else {
                return this.toArray();
            }
        };
        return Elements;
    }());
    _r.Elements = Elements;
    function select(params) {
        return new Elements(params);
    }
    _r.select = select;
})(_r || (_r = {}));
var _r;
(function (_r) {
    // TODO : multiple events dans le paramètre type, séparés par des virgules
    var _meshTriggers = [
        'NothingTrigger ',
        'OnPickTrigger',
        'OnLeftPickTrigger',
        'OnRightPickTrigger',
        'OnCenterPickTrigger',
        'OnPickDownTrigger',
        'OnPickUpTrigger',
        'OnPickOutTrigger',
        'OnLongPressTrigger',
        'OnPointerOverTrigger',
        'OnPointerOutTrigger',
        'OnEveryFrameTrigger',
        'OnIntersectionEnterTrigger',
        'OnIntersectionExitTrigger',
        'OnKeyDownTrigger',
        'OnKeyUpTrigger'
    ];
    function on(elements, event, handler, repeat) {
        if (repeat === void 0) { repeat = true; }
        var el = new _r.Elements(elements);
        el.each(function (element) {
            var _events;
            if (!_r.data(element, '_events')) {
                _events = [];
            }
            else {
                _events = _r.data(element, '_events');
            }
            if (!_events[event]) {
                _events[event] = [];
            }
            if (_r.is.Mesh(element) && _meshTriggers.indexOf(event) != -1) {
                if (!element["actionManager"]) {
                    element["actionManager"] = new BABYLON.ActionManager(_r.scene);
                }
                var action = new BABYLON.ExecuteCodeAction(BABYLON.ActionManager[event], function (evt) {
                    trigger(element, event, evt);
                });
                element["actionManager"].registerAction(action);
                _events[event].push({
                    handler: handler,
                    repeat: repeat,
                    action: action
                });
            }
            else {
                _events[event].push({
                    handler: handler,
                    repeat: repeat
                });
            }
            _r.data(element, '_events', _events);
        });
        return el;
    }
    _r.on = on;
    function one(elements, type, handler) {
        return _r.on(elements, type, handler, false);
    }
    _r.one = one;
    function off(elements, type, handler) {
        var el = new _r.Elements(elements);
        el.each(function (element) {
            var events = _r.data(element, '_events');
            if (events[type]) {
                if (handler) {
                    events[type] = events[type].filter(function (_event) {
                        if (_event.handler.toString() == handler.toString()) {
                            if (_event.action) {
                                var index = element["actionManager"].actions.indexOf(_event.action);
                                element["actionManager"].actions.splice(index, 1);
                            }
                        }
                        return _event.handler.toString() !== handler.toString();
                    });
                }
                else {
                    events[type] = [];
                }
            }
            _r.data(element, '_events', events);
        });
        return el;
    }
    _r.off = off;
    function trigger(elements, event, data) {
        var el = new _r.Elements(elements);
        el.each(function (element) {
            var events = _r.data(element, '_events');
            if (_r.is.Array(events[event])) {
                events[event].forEach(function (event) {
                    try {
                        event.handler.call(element, data);
                        if (!event.repeat) {
                            off(element, event, event.handler);
                        }
                    }
                    catch (ex) {
                        console.error("_r::trigger", ex);
                    }
                    finally {
                        return el;
                    }
                });
            }
        });
        return el;
    }
    _r.trigger = trigger;
})(_r || (_r = {}));
var _r;
(function (_r) {
    var is;
    (function (is) {
        function Function(functionToCheck) {
            var getType = {};
            return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
        }
        is.Function = Function;
        function Number(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }
        is.Number = Number;
        function PlainObject(n) {
            // Basic check for Type object that's not null
            if (typeof n == 'object' && n !== null) {
                // If Object.getPrototypeOf supported, use it
                if (typeof Object.getPrototypeOf == 'function') {
                    var proto = Object.getPrototypeOf(n);
                    return proto === Object.prototype || proto === null;
                }
                // Otherwise, use internal class
                // This should be reliable as if getPrototypeOf not supported, is pre-ES5
                return Object.prototype.toString.call(n) == '[object Object]';
            }
            // Not an object
            return false;
        }
        is.PlainObject = PlainObject;
        function Array(x) {
            return window['Array'].isArray(x);
        }
        is.Array = Array;
        function Mesh(x) {
            return x instanceof BABYLON.AbstractMesh;
        }
        is.Mesh = Mesh;
        function Vector3(x) {
            return x instanceof BABYLON.Vector3;
        }
        is.Vector3 = Vector3;
        function Vector2(x) {
            return x instanceof BABYLON.Vector2;
        }
        is.Vector2 = Vector2;
        function Color(x) {
            return HexColor(x) || x instanceof BABYLON.Color3 || x instanceof BABYLON.Color4;
        }
        is.Color = Color;
        function HexColor(x) {
            return String(x) && x[0] == '#';
        }
        is.HexColor = HexColor;
        function Float(n) {
            return Number(n) === n && n % 1 !== 0;
        }
        is.Float = Float;
        function Int(n) {
            return Number(n) === n && n % 1 === 0;
        }
        is.Int = Int;
        function Quaternion(n) {
            return n instanceof BABYLON.Quaternion;
        }
        is.Quaternion = Quaternion;
        function Matrix(n) {
            return n instanceof BABYLON.Matrix;
        }
        is.Matrix = Matrix;
        function String(x) {
            return typeof x === "string";
        }
        is.String = String;
        function Material(x) {
            return x instanceof BABYLON.Material;
        }
        is.Material = Material;
        function Texture(x) {
            return x instanceof BABYLON.Texture;
        }
        is.Texture = Texture;
        function PatchFile(expr) {
            if (typeof expr !== 'string') {
                return false;
            }
            var split = expr.split('.');
            var extension = split[split.length - 1].trim();
            return extension == 'runtime' || extension == 'patch' || extension == 'js';
        }
        is.PatchFile = PatchFile;
    })(is = _r.is || (_r.is = {}));
})(_r || (_r = {}));
var _r;
(function (_r) {
    function init(scene) {
        if (scene) {
            _r.scene = scene;
            _r.engine = scene.getEngine();
            _r.canvas = _r.engine.getRenderingCanvas();
        }
        var runtime = function (params) {
            return _r.select(params);
        };
        Object.getOwnPropertyNames(_r).forEach(function (property) {
            runtime[property] = _r[property];
        });
        runtime["engine"] = _r.engine;
        runtime["scene"] = _r.scene;
        runtime["canvas"] = _r.canvas;
        window["_r"] = runtime;
        _r.isReady = true;
        _r.trigger(window, "ready");
    }
    _r.init = init;
    _r.isReady = false;
    function ready(callback) {
        if (_r.isReady) {
            callback(_r.scene, _r.engine, _r.canvas);
        }
        else {
            _r.on(window, 'ready', callback);
        }
    }
    _r.ready = ready;
    function load(scene, assets) {
        var deferred = Q.defer();
        if (_r.is.Function(scene)) {
            _r.scene = new BABYLON.Scene(_r.engine);
            scene.call(this, _r.scene, _r.engine, _r.canvas);
            deferred.resolve(_r.scene);
        }
        else {
            BABYLON.SceneLoader.Load(assets || '', scene, _r.engine, function (_scene) {
                _r.scene = _scene;
                deferred.resolve(_r.scene);
            });
        }
        return deferred.promise;
    }
    function launch(params) {
        var deferred = Q.defer();
        if (params.hasOwnProperty('container')) {
            if (_r.is.String(params['container'])) {
                _r.canvas = document.getElementById(params.container);
            }
            else {
                _r.canvas = params['container'];
            }
        }
        else {
            var style = document.createElement('style');
            style.appendChild(document.createTextNode('html, body, canvas { width : 100%; height : 100%; padding : 0; margin : 0; overflow : hidden }'));
            document.getElementsByTagName("head")[0].appendChild(style);
            // Canvas
            _r.canvas = document.createElement('canvas');
            _r.canvas.setAttribute('touch-action', 'none');
            document.body.appendChild(_r.canvas);
        }
        _r.engine = new BABYLON.Engine(_r.canvas, true, null);
        window.addEventListener('resize', function () {
            _r.engine.resize();
        });
        if (params.ktx) {
            if (_r.is.Array(params.ktx)) {
                _r.engine.setTextureFormatToUse(params.ktx);
            }
            else {
                if (params.ktx === true) {
                    _r.engine.setTextureFormatToUse(['-astc.ktx', '-dxt.ktx', '-pvrtc.ktx', '-etc2.ktx']);
                }
            }
        }
        if (params.enableOfflineSupport) {
            _r.engine.enableOfflineSupport = params.enableOfflineSupport;
        }
        else {
            _r.engine.enableOfflineSupport = false;
        }
        load(params.scene, params.assets).then(function () {
            var promises = [];
            if (params.hasOwnProperty('patch')) {
                params.patch.forEach(function (_patch) {
                    promises.push(_r.patchFile.load(_patch));
                });
            }
            Q.all(promises).then(function (data) {
                if (params.hasOwnProperty('activeCamera')) {
                    _r.scene.setActiveCameraByName(params.activeCamera);
                    _r.scene.activeCamera.attachControl(_r.canvas, true);
                }
                else {
                    if (_r.scene.cameras.length > 0) {
                        _r.scene.setActiveCameraByName(_r.scene.cameras[0].name);
                        _r.scene.activeCamera.attachControl(_r.canvas, true);
                    }
                }
                try {
                    data.forEach(function (_patch) {
                        _r.patchFile.apply(_patch);
                    });
                }
                catch (exception) {
                    console.error(exception);
                }
                if (params.beforeFirstRender) {
                    try {
                        params.beforeFirstRender.call(_r.scene);
                    }
                    catch (exception) {
                        console.error(exception);
                    }
                }
                init();
                deferred.resolve();
                _r.renderloop.run();
            });
        });
        return deferred.promise;
    }
    _r.launch = launch;
})(_r || (_r = {}));
var _r;
(function (_r) {
    var library;
    (function (library) {
        library.libraries = [];
        function show(params) {
            var deferred = Q.defer();
            BABYLON.SceneLoader.ImportMesh(null, params.rootUrl, params.fileName, _r.scene, function (meshes) {
                var names = [];
                if (params.patch) {
                    var promises = [];
                    params.patch.forEach(function (_patch) {
                        promises.push(_r.patchFile.load(_patch));
                    });
                    Q.all(promises).then(function (data) {
                        try {
                            data.forEach(function (_patch) {
                                _r.patchFile.apply(_patch);
                            });
                            deferred.resolve(meshes);
                        }
                        catch (exception) {
                            console.error(exception);
                        }
                    });
                }
                else {
                    deferred.resolve(meshes);
                }
            }, function () {
                //deferred.notify(arguments[0]);
            }, function () {
                deferred.reject("Error while _r.importLibrary");
            });
            return deferred.promise;
        }
        library.show = show;
        function hide(libraryName) {
            if (_r.library.libraries[libraryName]) {
                _r.library.libraries[libraryName].forEach(function (meshName) {
                    _r.scene.getMeshByName(meshName).dispose(true);
                });
            }
        }
        library.hide = hide;
    })(library = _r.library || (_r.library = {}));
})(_r || (_r = {}));
var _r;
(function (_r) {
    var light;
    (function (light) {
        ;
        function hemispheric(params) {
            if (params.direction) {
                if (!_r.is.Vector3(params.direction)) {
                    params.direction = new BABYLON.Vector3(params.direction['x'] ? params.direction['x'] : 0, params.direction['y'] ? params.direction['y'] : 0, params.direction['z'] ? params.direction['z'] : 0);
                }
            }
            else {
                params.direction = new BABYLON.Vector3(0, 0, 0);
            }
            var _light = new BABYLON.HemisphericLight(params.name, params.direction, _r.scene);
            return _r.merge(_light, params, ['name', 'direction']);
        }
        light.hemispheric = hemispheric;
        ;
        _r.override(['light.hemispheric'], function (target, source, property) {
            return hemispheric(source[property]);
        });
    })(light = _r.light || (_r.light = {}));
})(_r || (_r = {}));
var _r;
(function (_r) {
    function assignMaterial() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var meshes, subMaterial, material;
        if (args.length == 3) {
            meshes = _r.select(args[0]);
            subMaterial = args[1];
            material = _r.select(args[2])[0];
        }
        else {
            if (args.length == 2) {
                meshes = _r.select(args[0]);
                material = _r.select(args[1])[0];
            }
            else {
                console.error("_r.assignMaterial::wrong number of parameters");
                return;
            }
        }
        if (subMaterial != undefined) {
            meshes.each(function (mesh) {
                mesh.material.subMaterials[subMaterial] = material;
            });
        }
        else {
            meshes.each(function (mesh) {
                mesh.material = material;
            });
        }
    }
    _r.assignMaterial = assignMaterial;
})(_r || (_r = {}));
(function (_r) {
    var material;
    (function (material) {
        function standard(params) {
            var _material = new BABYLON.StandardMaterial(params.name, _r.scene);
            return _r.merge(_material, params, ['name']);
        }
        material.standard = standard;
    })(material = _r.material || (_r.material = {}));
})(_r || (_r = {}));
var _r;
(function (_r) {
    var mesh;
    (function (mesh) {
        ;
        function box(params) {
            if (params.sideOrientation && _r.is.String(params.sideOrientation)) {
                params.sideOrientation = BABYLON.Mesh[params.sideOrientation];
            }
            var _box = BABYLON.Mesh.CreateBox(params.name, params.size, _r.scene, params.updatable, params.sideOrientation);
            return _r.merge(_box, params, ['name', 'size', 'updatable', 'sideOrientation']);
        }
        mesh.box = box;
        ;
        ;
        function sphere(params) {
            if (params.sideOrientation && _r.is.String(params.sideOrientation)) {
                params.sideOrientation = BABYLON.Mesh[params.sideOrientation];
            }
            var _sphere = BABYLON.Mesh.CreateSphere(params.name, params.segments, params.diameter, _r.scene, params.updatable, params.sideOrientation);
            return _r.merge(_sphere, params, ['name', 'segments', 'diameter', 'updatable', 'sideOrientation']);
        }
        mesh.sphere = sphere;
        ;
        ;
        function ground(params) {
            var _ground = BABYLON.Mesh.CreateGround(params.name, params.width, params.height, params.subdivisions, _r.scene, params.updatable);
            return _r.merge(_ground, params, ['name', 'width', 'height', 'subdivisions', 'updatable']);
        }
        mesh.ground = ground;
        ;
        _r.override(["mesh.ground"], function (target, source, property) {
            return ground(source[property]);
        });
        function plane(params) {
            if (params.sideOrientation && _r.is.String(params.sideOrientation)) {
                params.sideOrientation = BABYLON.Mesh[params.sideOrientation];
            }
            var _plane = BABYLON.Mesh.CreatePlane(params.name, params.size, _r.scene, params.updatable, params.sideOrientation);
            return _r.merge(_plane, params, ['name', 'size', 'updatable', 'sideOrientation']);
        }
        mesh.plane = plane;
    })(mesh = _r.mesh || (_r.mesh = {}));
})(_r || (_r = {}));
var _r;
(function (_r) {
    var patchFile;
    (function (patchFile) {
        function get(file) {
            var deferred = Q.defer();
            var xhr = new XMLHttpRequest();
            xhr.open("get", file, true);
            xhr.onload = function () {
                var status = xhr.status;
                if (status == 200) {
                    var data;
                    var isJson = false;
                    try {
                        data = JSON.parse(xhr.response);
                        isJson = true;
                    }
                    catch (error) {
                        isJson = false;
                    }
                    if (!isJson) {
                        try {
                            data = window["eval"].call(window, xhr.response);
                        }
                        catch (error) {
                            var __patch;
                            eval('var __patch = ' + xhr.response);
                            data = __patch;
                        }
                    }
                    if (data) {
                        deferred.resolve(data);
                    }
                    else {
                        console.warn('BABYLON.Runtime::no data found in ' + file);
                        deferred.resolve([{}]);
                    }
                }
                else {
                    deferred.reject(status);
                }
            };
            xhr.send();
            return deferred.promise;
        }
        patchFile.get = get;
        function apply(_patch) {
            if (Array.isArray(_patch)) {
                _patch.forEach(function (_item) {
                    Object.getOwnPropertyNames(_item).forEach(function (selector) {
                        var value = _item[selector];
                        _r.select(selector).patch(value);
                    });
                });
            }
            else {
                Object.getOwnPropertyNames(_patch).forEach(function (selector) {
                    var value = _patch[selector];
                    _r.select(selector).patch(value);
                });
            }
        }
        patchFile.apply = apply;
        function load(patch) {
            var deferred = Q.defer();
            if (_r.is.PatchFile(patch)) {
                _r.patchFile.get(patch).then(function (data) {
                    deferred.resolve(data);
                }, function (err) {
                    console.error("BABYLON.Runtime::Error while loading " + patch, err);
                    var emptyPromise = Q.defer();
                    emptyPromise.resolve({});
                    deferred.resolve(emptyPromise.promise);
                });
            }
            else {
                deferred.resolve(patch);
            }
            return deferred.promise;
        }
        patchFile.load = load;
    })(patchFile = _r.patchFile || (_r.patchFile = {}));
})(_r || (_r = {}));
var _r;
(function (_r) {
    var reflectionProbe;
    (function (reflectionProbe) {
        function create(params) {
            var probe = new BABYLON.ReflectionProbe("main", (params.size) ? params.size : 512, _r.scene);
            if (params.renderList) {
                params.renderList.forEach(function (mesh) {
                    probe.renderList.push(_r.select(mesh)[0]);
                });
            }
            else {
                var meshes = _r.select('*:mesh').toArray();
                meshes.forEach(function (mesh) {
                    probe.renderList.push(mesh);
                });
            }
            if (params.refreshRate) {
                if (_r.is.Number(params.refreshRate)) {
                    probe.refreshRate = params.refreshRate;
                }
                else {
                    probe.refreshRate = BABYLON.RenderTargetTexture[params.refreshRate];
                }
            }
            if (params.attachToMesh) {
                probe.attachToMesh(_r.select(params.attachToMesh)[0]);
            }
            if (params.position) {
                probe.position = params.position;
            }
            var result = _r.merge(probe.cubeTexture, params, ["name", "size", "renderList", "refreshRate", "refreshRate", "attachToMesh", "position"]);
            return result;
        }
        reflectionProbe.create = create;
    })(reflectionProbe = _r.reflectionProbe || (_r.reflectionProbe = {}));
})(_r || (_r = {}));
var _r;
(function (_r) {
    var renderloop;
    (function (renderloop) {
        function loop() {
            _r.scene.render();
        }
        function run() {
            _r.engine.runRenderLoop(loop);
        }
        renderloop.run = run;
        function stop() {
            _r.engine.stopRenderLoop(loop);
        }
        renderloop.stop = stop;
    })(renderloop = _r.renderloop || (_r.renderloop = {}));
})(_r || (_r = {}));
var _r;
(function (_r) {
    var texture;
    (function (texture_1) {
        /**
         * Create BABYLON.BaseTexture
         * @param params
         * @returns {BABYLON.BaseTexture}
         */
        function base(params) {
            if (params.samplingMode) {
                if (_r.is.Number(params.samplingMode)) {
                    params.samplingMode = params.samplingMode;
                }
                else {
                    params.samplingMode = BABYLON.Texture[params.samplingMode];
                }
            }
            var texture = new BABYLON.Texture(params.url, _r.scene, params.noMipmap, params.invertY, params.samplingMode, params.onLoad, params.onError, params.buffer);
            if (params.coordinatesMode) {
                if (_r.is.Number(params.coordinatesMode)) {
                    texture.coordinatesMode = params.coordinatesMode;
                }
                else {
                    texture.coordinatesMode = BABYLON.Texture[params.coordinatesMode];
                }
            }
            return _r.merge(texture, params, ["url", "noMipmap", "invertY", "coordinatesMode", "samplingMode", "onLoad", "onError", "buffer"]);
        }
        texture_1.base = base;
        /**
         * Create BABYLON.CubeTexture
         * @param params
         * @returns {BABYLON.CubeTexture}
         */
        function cube(params) {
            var texture = new BABYLON.CubeTexture(params.rootUrl, _r.scene, params.extensions, params.noMipmap, params.files, params.onLoad);
            if (params.coordinatesMode) {
                if (_r.is.Number(params.coordinatesMode)) {
                    texture.coordinatesMode = params.coordinatesMode;
                }
                else {
                    texture.coordinatesMode = BABYLON.Texture[params.coordinatesMode];
                }
            }
            return _r.merge(texture, params, ["rootUrl", "extensions", "noMipmap", "files", "onLoad", "coordinatesMode"]);
        }
        texture_1.cube = cube;
        /**
         * Create BABYLON.VideoTexture
         * @param params
         * @returns {BABYLON.VideoTexture}
         */
        function video(params) {
            if (params.samplingMode) {
                if (_r.is.Number(params.samplingMode)) {
                    params.samplingMode = params.samplingMode;
                }
                else {
                    params.samplingMode = BABYLON.Texture[params.samplingMode];
                }
            }
            var texture = new BABYLON.VideoTexture(params.name, params.urls, _r.scene, params.generateMipMaps, params.invertY, params.samplingMode);
            return _r.merge(texture, params, ["name", "urls", "generateMipMaps", "invertY", "samplingMode"]);
        }
        texture_1.video = video;
        /** TODO
        export function hdr() {
    
        }
    
        export function mirror() {
    
        }
    
        export function dynamic() {
    
        }
    
        export function map() {
    
        }
    
        export function font() {
    
        }
    
        export function refraction() {
    
        }
    
        **/
        _r.override(["texture.base"], function (target, source, property) {
            return texture.base(source[property]);
        });
        _r.override(["texture.cube"], function (target, source, property) {
            return texture.cube(source[property]);
        });
        _r.override(["texture.video"], function (target, source, property) {
            return texture.video(source[property]);
        });
    })(texture = _r.texture || (_r.texture = {}));
})(_r || (_r = {}));
//# sourceMappingURL=babylon-runtime.js.map