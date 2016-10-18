# Map Generation
Violentia uses tileable sections of map to construct the larger map as a whole. These sections of map are connected one to another via 'exit' nodes.

## Section Format
To begin with, sections are composed of sprite grids mapped to 4x4 pixel cells. Each one of these cells refer to a specific sprite entry. For the cell itself, it refers to an index that is contained in the section header file.

The actual structure of a section is:
  * <HEADER>
    * 8-bit type flag
    * 16-bit width
    * 16-bit height
    * nul-terminated string - spritesheet
    * 8-bit count of Sprite Map entries
    * <SPRITE MAP>
      * nul-terminated string - name
      * . . .
  * <CELLS>
    * 8-bit map index
    * . . .

If the **type** flag includes the COMPRESSED flag, then the `CELLS` data structure contains a variably sized structure with the following format:

  * <CELLS>
    * ( 8-bit map index + 16-bit count )

Each cell entry compresses repeating tiles into (index + count), such that 128 repeating 'blank' tiles will be ([0][10]).
