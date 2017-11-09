module _r {
    // TODO : multiple events dans le paramètre type, séparés par des virgules
    const  _meshTriggers = [
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

    const pointerEvents = [
        'pointermove',
        'pointerdown',
        'pointerup',
        'pointerover',
        'pointerout',
        'pointerenter',
        'pointerleave',
        'pointercancel',
    ];

    export function on(elements : any, event : string, handler : (...args : any[]) => void, repeat = true) : Elements {
        var el = new Elements(elements);
        el.each(function(element) {
            var _events = _r.data(element, '_events');
            if(!_events) {
                _events = {};
            }
            if(!_events[event]) {
                _events[event] = [];
            }
            if(_r.is.Mesh(element) &&  _meshTriggers.indexOf(event) != -1) {
                if(!element["actionManager"]) {
                    element["actionManager"] = new BABYLON.ActionManager(_r.scene)
                }
                var action = new BABYLON.ExecuteCodeAction(BABYLON.ActionManager[event], function(evt){
                    trigger(element, event, evt);
                });
                element["actionManager"].registerAction(action);
                _events[event].push({
                    handler : handler,
                    repeat : repeat,
                    action : action
                });
            }
            else {
                if(_r.is.DOM(element) && pointerEvents.indexOf(event) != -1) {
                    var listener = function(evt) {
                        trigger(element, event, evt);
                    };
                    element.addEventListener(event, listener , false);
                    _events[event].push({
                        handler : handler,
                        repeat : repeat,
                        listener : listener
                    });
                }
                else {
                    _events[event].push({
                        handler : handler,
                        repeat : repeat
                    });
                }
            }
            _r.data(element, '_events', _events);
        });

        return el;
    }

    export function one(elements : any, type : string, handler : (args : any) => void) : Elements {
       return  _r.on(elements, type, handler, false);
    }

    export function off(elements : any, event : string, handler? : (args : any) => void) : Elements {
        var el = new Elements(elements);
        el.each(function(element) {
            var events = _r.data(element, '_events');
            if(events[event]) {
                if(handler) {
                    events[event] = events[event].filter(function(_event) {
                        if(_event.handler.toString() == handler.toString()) {
                            if(_event.action) {
                                var index = element["actionManager"].actions.indexOf(_event.action);
                                element["actionManager"].actions.splice(index, 1);
                            }
                            if(_event.listener) {
                                element.removeEventListener(_event, _event.listener);
                            }
                        }
                        return _event.handler.toString() !== handler.toString();
                    });
                }
                else {
                    events[event] = [];
                }
            }
            _r.data(element, '_events', events);
        });
        return el;
    }

    export function trigger(elements : any, event : string, data? : any) : Elements {
        var el = new Elements(elements);
        el.each(function(element) {
            var events = _r.data(element, '_events');
            if(events && _r.is.Array(events[event])) {
                events[event].forEach(function(_event) {
                    try {
                        _event.handler.call(element, data);
                        if(!_event.repeat) {
                            if(_event.handler) {
                                off(element, event, _event.handler);
                            }
                            else {
                                off(element, event);
                            }

                        }
                    }
                    catch(ex) {
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
}
