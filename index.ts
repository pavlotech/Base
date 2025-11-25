import App from "src/infrastructure/services/app.service";
import Config from "src/utils/config.util";
 
new App({
    config: new Config(),
}) 