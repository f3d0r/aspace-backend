from data import acquireX, f, opt, multi_spot, directions
import sys

radii = [500, 1000, 2000, 5000]

origin = [sys.argv[1], sys.argv[2]]
destination = [sys.argv[3], sys.argv[4]]
car_size = sys.argv[5]

l = multi_spot(radii, origin, destination, car_size)
print("\n", l)
