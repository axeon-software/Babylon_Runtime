MouseTrap pour les keyboards events.

ex : _r.keyboard.on('shift+k', function() {

});

idées : on devrait toujours pouvoir faire

_r("scene").on("event1", [ {
    'mesh1' : { visible : false }
])

- On doit pouvoir créer une scène juste avec un fichier patch externe.
- Faire les 7 tutorials.
- _r({ "mesh::box" : { segments : 10 } });

- directives...override

"scene" : {
    "on::event1" : function() {
        _r.off(this, "event1")
    },
    "on::event2" : {
        
    }
}

"mesh1" : {
    "OnPickTrigger" : function(e) {
        
    }
}