/**
 * Created by iddo on 2/14/17.
 */
/**
 * Created by iddo on 12/19/16.
 */
"use strict";
const RapidAPI = require('rapidapi-connect'),
    LeafNode = require('./../LeafNode'),
    ObjectNode = require('./../ObjectNode'),
    ArrayNode = require('./../ArrayNode'),
    CompositeNode = require('./../CompositeNode');

class RapidAPINode {
    constructor(name, children, args) {
        this.name = name;
        this.args = args;
        this.children = children;
    }

    getName() {
        return this.name;
    }

    eval(context, ops) {
        //Init RapidAPI
        if (!ops.hasOwnProperty('RapidAPI')) {
            return new Promise((resolve, reject) => {reject(`OptionError: ops don't have RapidAPI keys`)});
        } else {

            const rapid = new RapidAPI(ops['RapidAPI']['projectName'], ops['RapidAPI']['apiKey']);
            return new Promise((resolve, reject) => {

                rapid.call(...this.getName().split('.'), this.args)
                    .on('success', (payload) => {
                        //If JSON and not parsed -> parse
                        try {
                            payload = JSON.parse(payload);
                        } catch (err) {
                            err = err;
                        } //Otherwise - no biggie, "you don't always get what you want" - M. Jagger
                        //Create context and add payload to it
                        let ctx = Object.assign({}, context);
                        ctx[this.getName()] = payload;
                        //Process down the tree...
                        if(typeof payload == 'string'){
                            (new LeafNode(this.getName())).eval(ctx).then(resolve).catch(reject);
                        } else if(typeof payload == 'object') {
                            let innerContext = Object.assign({}, context);
                            innerContext[this.getName()] =  payload;

                            let innerNode = new CompositeNode(this.getName(), this.children);

                            innerNode.eval(innerContext, ops).then(resolve).catch(reject);

                        } else { //"You don't het another chance, life ain't a Nintendo game" - Eminem
                            reject(`APIError: got invalid data type ${typeof payload} which is not supported by function nodes`);
                        }
                    })
                    .on('error', (err) => {
                        reject(`APIError: got error from ${this.getName()} API: ${err}`);
                    });
            });
        }

    }
}

module.exports = RapidAPINode;

//PLAYGROUND:

/*let fn = new RapidAPINode('GoogleTranslate.translate', [], {
 'apiKey': 'AIzaSyCDogEcpeA84USVXMS471PDt3zsG-caYDM',
 'string': 'hello world, what a great day',
 'targetLanguage': 'de'
 });

 let ops = {
 RapidAPI : {
 projectName : 'Iddo_demo_app_1',
 apiKey: '4c6e5cc0-8426-4c95-9e3b-60adba0e50f6'
 }
 };

 fn.eval({}, ops)
 .then((res) => {console.log(JSON.stringify(res))})
 .catch((err) => {console.warn(JSON.stringify(err))});*/