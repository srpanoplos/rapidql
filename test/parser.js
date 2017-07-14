/**
 * Created by iddo on 2/9/17.
 */
"use strict";

const assert = require('assert'),
    LeafNode = require('../src/Nodes/LeafNode'),
    CompositeNode = require('../src/Nodes/CompositeNode'),
    RenameNode = require('../src/Nodes/RenameNode'),
    OptionalNode = require('../src/Nodes/OptionalNode'),
    FunctionNode = require('../src/Nodes/FunctionNode');


const parse = require('../src/Parser/Parser').parse;

describe('Parser', () => {
    describe('Basics', () => {
        it('should return empty query', (done) => {
            parse(`{}`).then(val => {
                assert.deepEqual(val, []);
                done();
            }).catch(err => {
                done(`Resulted in error -> ${err}`);
            });
        });

        it('should reject empty string', (done) => {
            parse(``).then(val => {
                done(`Returned success with value - ${val}`);
            }).catch(err => {
                done();
            })
        });
    });

    it('should detect 1 leaf node', (done) => {
        parse(`{
            a
        }`).then((val) => {
            let n = val[0];
            assert.equal(val.length, 1); // Only 1 node
            assert.equal(n instanceof LeafNode, true); // Leaf node
            assert.equal(n.getName(), 'a'); //Name is a
            done();
        }).catch((err) => {
            done(`Rejected with error ${err}`);
        });
    });

    it('should detect 2 leaf nodes', (done) => {
        parse(`{
            b,
            c
        }`).then((val) => {
            assert.equal(val.length, 2); // Exactly 2 nodes

            //Node 1
            assert.equal(val[0] instanceof LeafNode, true); // Leaf node
            assert.equal(val[0].getName(), 'b'); //Name is b

            //Node 2
            assert.equal(val[1] instanceof LeafNode, true); // Leaf node
            assert.equal(val[1].getName(), 'c'); //Name is b

            done();
        }).catch((err) => {
            done(`Rejected with error ${err}`);
        });
    });

    it('should support composite nodes', (done) => {
        parse(`{
            a {
                b
            }
        }`).then((val) => {
            assert.equal(val.length, 1); // Exactly 1 root node

            assert.equal(val[0] instanceof CompositeNode, true); // Root node is composite node
            assert.equal(val[0].getName(), 'a'); // Root node's name is a

            assert.equal(val[0].children.length, 1); // Has one child
            assert.equal(val[0].children[0].getName(), 'b'); // Child name is b
            assert.equal(val[0].children[0] instanceof LeafNode, true); // Child is a leaf node

            done();

        }).catch((err) => {
            done(`Rejected with error ${err}`);
        });
    });

    it('should support function nodes', (done) => {
        parse(`{
            RapidAPI.Name.Function(key1:val1, key2:{subKey: subValue}) {
                a
            }
        }`).then((val) => {
            assert.equal(val.length, 1); // Exactly 1 root node

            assert.equal(val[0].hasOwnProperty('args'), true); // Check type. Only function nodes have args (it can be sub-type)
            assert.equal(val[0].getName(), 'RapidAPI.Name.Function'); // Root node's name is DataSource.Name.Function

            assert.equal(val[0].args['key1'], "val1"); //Check simple arg
            assert.deepEqual(val[0].args['key2'], {subKey: "subValue"}); //Check complex arg

            assert.equal(val[0].children.length, 1); // Has one child
            assert.equal(val[0].children[0].getName(), 'a'); // Child name is a
            assert.equal(val[0].children[0] instanceof LeafNode, true); // Child is a leaf node

            done();

        }).catch((err) => {
            done(`Rejected with error ${err}`);
        });
    });

    it('should fail with function nodes with unsupported names', (done) => {
        try {
            parse(`{
                UnsupportedType.Collection.Function(key: val) {
                    a
                }
            }`).then(val => {
                done(`Didn't catch UnsupportedType error`);
            }).catch(err => {
                done();
            })
        } catch (e) {
            done();
        }
    });

    describe('OptionalNode', () => {
        it('should support optional leaf nodes', async () => {
            const val = await parse(`
                {
                    ?a
                }
            `);
            let n = val[0];
            assert.equal(val.length, 1); // Only 1 node
            assert.equal(n instanceof OptionalNode, true); // Optional node
            assert.equal(n.getName(), "a");
            assert.equal(n.innerNode instanceof LeafNode, true);
        });

        it('should support optional composite nodes nodes', async () => {
            const val = await parse(`
                {
                    ?a {
                        b
                    }
                }
            `);
            let n = val[0];
            assert.equal(val.length, 1); // Only 1 node
            assert.equal(n instanceof OptionalNode, true); // Optional node
            assert.equal(n.getName(), "a");
            assert.equal(n.innerNode instanceof CompositeNode, true);
            assert.equal(n.innerNode.children.length, 1);
            assert.equal(n.innerNode.children[0].getName(), "b");
        });

        it('should support optional nodes in composite nodes', async () => {
            const val = await parse(`
                {
                    a {
                        ? b
                    }
                }
            `);
            let n = val[0];
            assert.equal(val.length, 1); // Only 1 node
            assert.equal(n instanceof CompositeNode, true); // Optional node
            assert.equal(n.getName(), "a");
            assert.equal(n.children.length, 1);
            assert.equal(n.children[0] instanceof OptionalNode, true);
            assert.equal(n.children[0].getName(), "b");
        });

        it('should support optional function nodes', async () => {
            const val = await parse(`
                {
                    ?RapidAPI.Name.Function(key1:val1, key2:{subKey: subValue}) {
                        b
                    }
                }
            `);
            let n = val[0];
            assert.equal(val.length, 1); // Only 1 node
            assert.equal(n instanceof OptionalNode, true); // Optional node
            assert.equal(n.getName(), "RapidAPI.Name.Function");
            assert.equal(n.innerNode instanceof FunctionNode, true);
            assert.equal(n.innerNode.children.length, 1);
            assert.equal(n.innerNode.children[0].getName(), "b");
        });

        it('should support optional renamed nodes', async () => {
            const val = await parse(`
                {
                    ?a:b
                }
            `);
            let n = val[0];
            assert.equal(val.length, 1); // Only 1 node
            assert.equal(n instanceof OptionalNode, true); // Optional node
            assert.equal(n.innerNode instanceof RenameNode, true); // Optional node
            assert.equal(n.innerNode.innerNode instanceof LeafNode, true); // Optional node
        });
    });

    describe('RenameNode', () => {
        it('should support renamed leaf nodes', async () => {
            const val = await parse(`
                {
                    b:a
                }
            `);
            let n = val[0];
            assert.equal(val.length, 1); // Only 1 node
            assert.equal(n instanceof RenameNode, true); // Optional node
            assert.equal(n.getName(), "b");
            assert.equal(n.innerNode instanceof LeafNode, true);
            assert.equal(n.innerNode.getName(), "a");
        });

        it('should support renamed composite nodes', async () => {
            const val = await parse(`
                {
                    c:a {
                        b
                    }
                }
            `);
            let n = val[0];
            assert.equal(val.length, 1); // Only 1 node
            assert.equal(n instanceof RenameNode, true); // Optional node
            assert.equal(n.getName(), "c");
            assert.equal(n.innerNode instanceof CompositeNode, true);
            assert.equal(n.innerNode.getName(), "a");
            assert.equal(n.innerNode.children.length, 1);
            assert.equal(n.innerNode.children[0].getName(), "b");
        });

        it('should support renamed nodes in composite nodes', async () => {
            const val = await parse(`
                {
                    a {
                        c:b
                    }
                }
            `);
            let n = val[0];
            assert.equal(val.length, 1); // Only 1 node
            assert.equal(n instanceof CompositeNode, true); // Optional node
            assert.equal(n.getName(), "a");
            assert.equal(n.children.length, 1);
            assert.equal(n.children[0] instanceof RenameNode, true);
            assert.equal(n.children[0].getName(), "c");
            assert.equal(n.children[0].innerNode instanceof LeafNode, true);
        });

        it('should support optional function nodes', async () => {
            const val = await parse(`
                {
                    a:RapidAPI.Name.Function(key1:val1, key2:{subKey: subValue}) {
                        b
                    }
                }
            `);
            let n = val[0];
            assert.equal(val.length, 1); // Only 1 node
            assert.equal(n instanceof RenameNode, true); // Optional node
            assert.equal(n.getName(), "a");
            assert.equal(n.innerNode instanceof FunctionNode, true);
            assert.equal(n.innerNode.children.length, 1);
            assert.equal(n.innerNode.children[0].getName(), "b");
        });
    });
});