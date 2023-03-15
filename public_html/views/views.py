import django_version
import authorized
import handlers
import tools


class App(handlers.BaseRequestHandler):
    @authorized.role()
    def get(self, *args, **kwargs):
        from settings.secrets import G_MAPS_API_KEY
        # gmods = {
        #   "modules": [
        #   ]
        # }
        d = kwargs.get('d')
        d['constants'] = {
            'dev': tools.on_dev_server()
        }
        d['alt_bootstrap'] = {
            "UserStore": {
                'user': self.user.json(is_self=True) if self.user else None
            }
        }
        # d['gautoload'] = urllib.quote_plus(json.dumps(gmods).replace(' ',''))
        d['gmap_api_key'] = G_MAPS_API_KEY
        self.render_template("index.html", **d)

