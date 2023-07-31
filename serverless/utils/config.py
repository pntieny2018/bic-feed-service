import yaml
from yaml.loader import SafeLoader

class Config:

    _environment = 'dev'
    data = {}

    def __init__(self, environment) -> None:
        if environment is not None:
            self._environment = environment
        self.load()

    def load(self) -> dict:
        # Common configuration will always be loaded
        try:
            with open(f'config/common.yaml') as f:
                self.data = yaml.load(f, Loader=SafeLoader) or {}
        except FileNotFoundError:
            pass

        # These configurations will be loaded based on the environment specified via the context
        # These configurations will override the common one
        with open(f'config/{self._environment}.yaml') as f:
            self.data.update(yaml.load(f, Loader=SafeLoader))

        return self.data

    def get(self, key):
        return self.data[key]
