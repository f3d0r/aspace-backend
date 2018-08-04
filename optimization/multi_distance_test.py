from data import acquireX, f, opt, multi_spot
import sys

radii = [500, 1000, 2000, 5000]

origin = [sys.argv[1], sys.argv[2]]
destination = [sys.argv[3], sys.argv[4]]
car_size = sys.argv[5]
# origin = [-122.32080361279635, 47.613874629189766]
# destination = [-122.45, 37.91]
# car_size = 10

l = multi_spot(radii, origin, destination, car_size)
print("\n", l)
