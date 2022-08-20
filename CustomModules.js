import * as fs from "fs"
import * as path from "path"
import requireRuntime from "require-runtime"

/*
CUSTOM MODULES

Checks ./modules/ directory for .js files

A custom module is like any other module,
when instantiated it is passed the clientHandler.
Like that it has access to all packets
and other modules as well.

Custom Module Syntax:

--------- DemoModule.js ---------
module.exports = class Demo {

    constructor(clientHandler) {
        this.clientHandler = clientHandler
    }

}
---------------------------------
*/

export class CustomModules {

    constructor(clientHandler) {
        this.clientHandler = clientHandler

        this.modules = []
        this.loadModules()
    }

    loadModules() {
        this.modules = []
        // store modules in "modules" dir
        fs.readdir('./modules', (err, files) => {
            if (files !== undefined) {
                files.forEach(file => {
                    if (file.endsWith(".js")) {
                        const p = path.join(process.cwd(), "modules", file)
                        try {
                            const clazz = requireRuntime(p)
                            this.modules.push(new clazz(this.clientHandler))
                            console.log(`Loaded custom module ${file}`)
                        } catch (e) {
                            console.log(`Error loading module ${file}.`)
                            console.log(e)
                        }
                    }
                })
            }
        })
    }

}