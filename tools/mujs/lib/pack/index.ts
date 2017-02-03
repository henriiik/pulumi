// Copyright 2016 Marapongo, Inc. All rights reserved.

import * as yaml from "js-yaml";
import * as ast from "../ast";
import * as tokens from "../tokens";

// mufileBase is the base filename for Mufiles (sans extension).
export const mufileBase = "Mu";

// mupackBase is the base filename for MuPackages (sans extension).
export const mupackBase = "Mupack";

// defaultFormatExtension is the default extension used for the Mufile/MuPackage formats.
export const defaultFormatExtension = ".json";

// marshalers is a mapping from Mufile/MuPackage format extension to a function to marshal an object into a string.
export let marshalers = new Map<string, (obj: any) => string>([
    [ ".json", (obj: any) => JSON.stringify(obj, null, 4) ],
    [ ".yaml", yaml.dump ],
]);

// unmarshalers is a mapping from Mufile/MuPackage format extension to a function to unmarshal a raw string blob.
export let unmarshalers = new Map<string, (raw: string) => any>([
    [ ".json", JSON.parse ],
    [ ".yaml", yaml.load  ],
]);

// Manifest is the "metadata-only" section of a package's definition file.  This part is shared between already compiled
// packages loaded as dependencies in addition to packages that are actively being compiled (and hence possibly missing
// the other parts in the full blown Package interface).
export interface Manifest {
    name: tokens.PackageToken;           // a required fully qualified name.
    description?: string;                // an optional informational description.
    author?: string;                     // an optional author.
    website?: string;                    // an optional website for additional information.
    license?: string;                    // an optional license governing this package's usage.
}

// Package is a fully compiled package definition.
export interface Package extends Manifest {
    dependencies?: tokens.ModuleToken[]; // all of the module dependencies.
    modules?: ast.Modules;               // a collection of top-level modules.
}

