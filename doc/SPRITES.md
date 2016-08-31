# What do we want a sprite to be?
  1. A set of data values corresponding to a spritesheet
    * These data values are:
      * Animation Sets (x,y + (optional) w,h and (optional) ms per frame)
      * Basic attachment coordinates, such as "legs: [8, 8]" for x,y pixel pos
        * "apoints" can have other sprites attached to them -- during a render call, the full parenting chain is traversed for offsets and rotations.
      * Each sprite can have its own "origin" apoint that specifies where the "center" of the sprite should be considered
  2. In-game, a sprite:
    * has origin and any number of "apoints"
    * has a list of attached (optional)children and a (optional)parent
    * If a sprite is attached, it is not rendered within a Quadrant, but rather during the render call of a specific sprite.
