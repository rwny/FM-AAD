# System Templates

## Air Conditioning (AC) - Hierarchical
Structure: Room -> AC Category -> Physical Units

```markdown
- [RoomName]
    - [RoomName]-AC
        - FCU-101
        - CDU-101
```

## Sanitary (SAN) - Flow Based
Structure: Fixture -> Pipe -> Collector

```markdown
- LAV-1
    - P-WASTE-2in
        - Manhole-1 {}
```

## Electrical (EE) - Hierarchical
Structure: Floor -> Panel -> Breaker -> Load

```markdown
- floor-1
    - LP-1
        - SW-1
```
