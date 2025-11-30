import { TestingModuleBuilder } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

export class TestModuleBuilder {
  private providers: any[] = [];
  private imports: any[] = [];
  private controllers: any[] = [];

  addProvider(provider: any): this {
    this.providers.push(provider);
    return this;
  }

  addProviders(providers: any[]): this {
    this.providers.push(...providers);
    return this;
  }

  addImport(module: any): this {
    this.imports.push(module);
    return this;
  }

  addImports(modules: any[]): this {
    this.imports.push(...modules);
    return this;
  }

  addController(controller: any): this {
    this.controllers.push(controller);
    return this;
  }

  addControllers(controllers: any[]): this {
    this.controllers.push(...controllers);
    return this;
  }

  build(): TestingModuleBuilder {
    return Test.createTestingModule({
      imports: this.imports.length > 0 ? this.imports : undefined,
      providers: this.providers.length > 0 ? this.providers : undefined,
      controllers: this.controllers.length > 0 ? this.controllers : undefined,
    });
  }
}

