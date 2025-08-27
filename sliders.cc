stack(
  s("bd*2 ~ sd ~").bank("RolandTR808")
    .gain(slider(0.8, 0, 1, 0.01))
    .speed(slider(1, -2, 2, 0.1))
    .room(slider(0.2, 0, 1, 0.01)),
  
  note("c3 eb3 g3 bb3").s("sawtooth")
    .slow(slider(4, 1, 8, 0.1))
    .gain(slider(0.5, 0, 1, 0.01))
    .lpf(slider(1200, 200, 4000, 50))
    .attack(slider(0.1, 0, 1, 0.01))
    .release(slider(0.3, 0.1, 2, 0.01)),
  
  note("c5 d5 eb5 f5 g5").s("triangle")
    .fast(slider(2, 0.5, 4, 0.1))
    .gain(slider(0.3, 0, 1, 0.01))
    .delay(slider(0.25, 0, 0.8, 0.01))
    .pan(slider(0.5, 0, 1, 0.01)),
  
  s("hh*4").bank("RolandTR909")
    .gain(slider(0.25, 0, 1, 0.01))
    .hpf(slider(8000, 1000, 15000, 100))
    .crush(slider(8, 1, 16, 1))
)
