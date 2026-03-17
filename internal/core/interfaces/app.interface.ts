import { IBaseDeps } from "@core/interfaces/deps.interface";
import Loader from "@core/classes/loader.class";
import Router from "@core/classes/router.class";

export interface IDependencies {
    deps: IBaseDeps;
    loader: Loader;
    router: Router;
}
