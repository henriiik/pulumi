// Copyright 2016-2018, Pulumi Corporation.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as assert from "assert";
import * as pulumi from "../index";
import { CustomResourceOptions } from "../resource";
import { MockCallArgs, MockResourceArgs } from "../runtime";

pulumi.runtime.setMocks({
    call: (args: MockCallArgs) => {
        switch (args.token) {
        case "test:index:MyFunction":
            return { out_value: 59 };
        default:
            return {};
        }
    },
    newResource: (args: MockResourceArgs): {id: string; state: any} => {
        switch (args.type) {
        case "aws:ec2/instance:Instance":
            assert.strictEqual(args.custom, true);
            const state = {
                arn: "arn:aws:ec2:us-west-2:123456789012:instance/i-1234567890abcdef0",
                instanceState: "running",
                primaryNetworkInterfaceId: "eni-12345678",
                privateDns: "ip-10-0-1-17.ec2.internal",
                publicDns: "ec2-203-0-113-12.compute-1.amazonaws.com",
                publicIP: "203.0.113.12",
            };
            return { id: "i-1234567890abcdef0", state: { ...args.inputs, ...state } };
        case "pkg:index:MyCustom":
            assert.strictEqual(args.custom, true);
            return { id: args.name + "_id", state: args.inputs };
        case "pkg:index:MyRemoteComponent":
            return {
                id: `${args.name}_id`,
                state: {
                    ...args.inputs,
                    outprop: `output: ${args.inputs["inprop"]}`,
                },
            };
        default:
            assert.strictEqual(args.custom, false);
            return { id: "", state: {} };
        }
    },
});

class MyComponent extends pulumi.ComponentResource {
    outprop: pulumi.Output<string>;
    constructor(name: string, inprop: pulumi.Input<string>, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:index:MyComponent", name, {}, opts);
        this.outprop = pulumi.output(inprop).apply(x => `output: ${x}`);
    }
}

class MyRemoteComponent extends pulumi.ComponentResource {
    outprop!: pulumi.Output<string>;
    constructor(name: string, inprop: pulumi.Input<string>, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:index:MyRemoteComponent", name, { inprop, outprop: undefined }, opts, true);
    }
}

class Instance extends pulumi.CustomResource {
    publicIP!: pulumi.Output<string>;
    constructor(name: string, opts?: CustomResourceOptions) {
        const props = { publicIP: undefined };
        super("aws:ec2/instance:Instance", name, props, opts);
    }
}

pulumi.runtime.registerResourceModule("aws", "ec2/instance", {
    construct: (name: string, type: string, urn: string): pulumi.Resource => {
        switch (type) {
        case "aws:ec2/instance:Instance":
            return new Instance(name, { urn });
        default:
            throw new Error(`unknown resource type ${type}`);
        }
    },
});

class MyCustom extends pulumi.CustomResource {
    instance!: pulumi.Output<Instance>;

    public static get(name: string, id: pulumi.Input<pulumi.ID>, state?: Record<string, any>, opts?: pulumi.CustomResourceOptions): MyCustom {
        return new MyCustom(name, state, { ...opts, id });
    }

    constructor(name: string, props?: Record<string, any>, opts?: CustomResourceOptions) {
        super("pkg:index:MyCustom", name, props, opts);
    }
}

async function invoke(): Promise<number> {
    const value = await pulumi.runtime.invoke("test:index:MyFunction", { value: 41 });
    return value["out_value"];
}

const mycomponent = new MyComponent("mycomponent", "hello");
const myinstance = new Instance("instance");
const mycustom = new MyCustom("mycustom", { instance: myinstance });
const invokeResult = invoke();
const myremotecomponent = new MyRemoteComponent("myremotecomponent", pulumi.interpolate`hello: ${myinstance.id}`);

describe("mocks", function() {
    describe("component", function() {
        it("has expected output value", done => {
            mycomponent.outprop.apply(outprop => {
                assert.strictEqual(outprop, "output: hello");
                done();
            });
        });
    });

    describe("remote component", function() {
        it("has expected output value", done => {
            myremotecomponent.outprop.apply(outprop => {
                assert.strictEqual(outprop.startsWith("output: hello: "), true);
                done();
            });
        });
    });

    describe("custom", function() {
        it("instance has expected output value", done => {
            myinstance.publicIP.apply(ip => {
                assert.strictEqual(ip, "203.0.113.12");
                done();
            });
        });

        it("mycustom has expected output value", done => {
            mycustom.instance.apply(instance => {
                done();
            });
        });

        describe("get", function() {
            it("has expected id output value", done => {
                const myc = MyCustom.get("mycustom", "myid");
                myc.id.apply(id => {
                    try {
                        assert.strictEqual(id, "myid");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            });
        });
    });

    describe("invoke", function() {
        it("has expected result", done => {
            invokeResult.then(value => {
                assert.strictEqual(value, 59);
                done();
            });
        });
    });
});
