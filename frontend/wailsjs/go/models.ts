export namespace imager {
	
	export class ResizeConfig {
	    width: number;
	    height: number;
	    keepAspect: boolean;
	    quality: number;
	    outputFormat: string;
	    resizeMode: string;
	    outputDir: string;
	    overwrite: boolean;
	
	    static createFrom(source: any = {}) {
	        return new ResizeConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	        this.keepAspect = source["keepAspect"];
	        this.quality = source["quality"];
	        this.outputFormat = source["outputFormat"];
	        this.resizeMode = source["resizeMode"];
	        this.outputDir = source["outputDir"];
	        this.overwrite = source["overwrite"];
	    }
	}
	export class ResizeResult {
	    oldPath: string;
	    newPath: string;
	    oldName: string;
	    newName: string;
	    status: string;
	    error: string;
	    originalW: number;
	    originalH: number;
	    outputW: number;
	    outputH: number;
	    originalSize: number;
	    outputSize: number;
	
	    static createFrom(source: any = {}) {
	        return new ResizeResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.oldPath = source["oldPath"];
	        this.newPath = source["newPath"];
	        this.oldName = source["oldName"];
	        this.newName = source["newName"];
	        this.status = source["status"];
	        this.error = source["error"];
	        this.originalW = source["originalW"];
	        this.originalH = source["originalH"];
	        this.outputW = source["outputW"];
	        this.outputH = source["outputH"];
	        this.originalSize = source["originalSize"];
	        this.outputSize = source["outputSize"];
	    }
	}

}

export namespace main {
	
	export class DirEntry {
	    name: string;
	    path: string;
	    isDir: boolean;
	    ext: string;
	    size: number;
	
	    static createFrom(source: any = {}) {
	        return new DirEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.isDir = source["isDir"];
	        this.ext = source["ext"];
	        this.size = source["size"];
	    }
	}
	export class FileInfo {
	    path: string;
	    name: string;
	    ext: string;
	    sizeBytes: number;
	    sizeLabel: string;
	
	    static createFrom(source: any = {}) {
	        return new FileInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.ext = source["ext"];
	        this.sizeBytes = source["sizeBytes"];
	        this.sizeLabel = source["sizeLabel"];
	    }
	}
	export class RenameResult {
	    oldPath: string;
	    newPath: string;
	    oldName: string;
	    newName: string;
	    status: string;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new RenameResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.oldPath = source["oldPath"];
	        this.newPath = source["newPath"];
	        this.oldName = source["oldName"];
	        this.newName = source["newName"];
	        this.status = source["status"];
	        this.error = source["error"];
	    }
	}

}

export namespace renamer {
	
	export class RenameRule {
	    id: string;
	    type: string;
	    enabled: boolean;
	    search: string;
	    replace: string;
	    useRegex: boolean;
	    prefix: string;
	    suffix: string;
	    caseType: string;
	    seqStart: number;
	    seqPad: number;
	    seqSeparator: string;
	
	    static createFrom(source: any = {}) {
	        return new RenameRule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.type = source["type"];
	        this.enabled = source["enabled"];
	        this.search = source["search"];
	        this.replace = source["replace"];
	        this.useRegex = source["useRegex"];
	        this.prefix = source["prefix"];
	        this.suffix = source["suffix"];
	        this.caseType = source["caseType"];
	        this.seqStart = source["seqStart"];
	        this.seqPad = source["seqPad"];
	        this.seqSeparator = source["seqSeparator"];
	    }
	}

}

