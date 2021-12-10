# coding=utf-8
# *** WARNING: this file was generated by test. ***
# *** Do not edit by hand unless you're certain you know what you are doing! ***

import warnings
import pulumi
import pulumi.runtime
from typing import Any, Mapping, Optional, Sequence, Union, overload
from . import _utilities
from ._enums import *

__all__ = [
    'Container',
]

@pulumi.output_type
class Container(dict):
    def __init__(__self__, *,
                 size: 'ContainerSize',
                 brightness: Optional['ContainerBrightness'] = None,
                 color: Optional[str] = None,
                 material: Optional[str] = None):
        pulumi.set(__self__, "size", size)
        if brightness is None:
            brightness = 1
        if brightness is not None:
            pulumi.set(__self__, "brightness", brightness)
        if color is not None:
            pulumi.set(__self__, "color", color)
        if material is not None:
            pulumi.set(__self__, "material", material)

    @property
    @pulumi.getter
    def size(self) -> 'ContainerSize':
        return pulumi.get(self, "size")

    @property
    @pulumi.getter
    def brightness(self) -> Optional['ContainerBrightness']:
        return pulumi.get(self, "brightness")

    @property
    @pulumi.getter
    def color(self) -> Optional[str]:
        return pulumi.get(self, "color")

    @property
    @pulumi.getter
    def material(self) -> Optional[str]:
        return pulumi.get(self, "material")


