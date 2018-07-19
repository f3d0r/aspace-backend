##############################################################################
##############################################################################
'''
Algorithm:
	1. Obtain all spots within certain radius of user destination
	2. Filter out all occupied spots
	3. For each parking spot, compute driving time from origin to spot and
	add to walking / biking time from spot to user destination
	4. Store this total time, the parking cost, and all other parameters
	in a |spots| x |params| np.array (optional; but must know where to find)
	5. Optimize cost function under following example constraints:
		i.   Spot < 0.1 mile from dest   (most expensive)
		ii.  Spot < 0.25 mile from dest  (medium price)
		iii. Spot < 1 mile from dest	 (cheapest)
	6. Return each minimum (i.e. best spot w.r.t. conditions)

'''
###############################################################################
###############################################################################

import numpy as np
from scipy.optimize import minimize

import requests
import json

#from mapbox import DirectionsMatrix

url = "https://api.trya.space/v1/parking/get_min_size_parking"
headers = {'content-type': 'application/json'}
prefix1 = "https://api.mapbox.com/directions-matrix/v1/mapbox/"
suffix1 = "?access_token=pk.eyJ1IjoiYXNwYWNlLWluYyIsImEiOiJjamo5MGs4OGUxOHU2M3Jzd3hjOXl4NHl1In0.mazlVIdsGDts6XTbutjoCg"
prefix2 = "https://api.mapbox.com/directions/v5/mapbox/driving/"
suffix2 = "?steps=true&geometries=polyline&access_token=pk.eyJ1IjoiYXNwYWNlLWluYyIsImEiOiJjamo5MGs4OGUxOHU2M3Jzd3hjOXl4NHl1In0.mazlVIdsGDts6XTbutjoCg"


def acquireX(origin, destination, radius, spot_size, params):
    ''' 1. Get parking spots by radius '''
    # User's lat, lng origin must go in payload:
    querystring = {"radius_feet": str(
        radius), "spot_size_feet": str(spot_size)}
    payload = "{\n\t\"lat\": \"" + \
        str(origin[1]) + "\",\n\t\"lng\": \"" + str(origin[0]) + "\"\n}"
    response = requests.request("POST", url, data=payload,
                                headers=headers, params=querystring)
    data = json.loads(str(response.text))

    ''' 2. Filter '''
    data = [d for d in data if d['occupied'] != u'T']
    if len(data) == 0:
        print("No spots are open within a radius of "+str(radius)+" feet.")
        return [[], []]

    ''' 3. Acquire driving times '''
    # User's origin and destination points:
    destination = str(destination[0])+',' + \
        str(destination[1])  # "-122.45,37.91"
    origin = str(origin[0])+','+str(origin[1])  # "-122.42,37.78"

    # Start with just 25 spots, since this is max payload to mapbox
    # Multipool / thread this loop later to make requests in parallel
    # print("\nNumber of unoccupied spots :",len(data))
    times = np.array([[]])
    for i in range(int(np.ceil(len(data)/24))+1):
        try:
            dat = data[24*i:24*i+24]  # -1 because of origin point...
        except:
            dat = data[24*i::]
        # if empty, stop
        if len(dat) == 0:
            break

        coords = ["%f,%f" % (d['lng'], d['lat']) for d in dat]
        spots = ';'.join(coords)

        response = requests.request(
            "GET", prefix1 + "driving/" + origin + ";" + spots + suffix1)
        drive = json.loads(str(response.text))
        d_times = np.array([drive['durations'][0][1::]])

        response = requests.request(
            "GET", prefix1 + "walking/" + destination + ";" + spots + suffix1)
        walk = json.loads(str(response.text))
        # w_times matrix is symmetric so can take row instead of column
        w_times = np.array([walk['durations'][0][1::]])
        times = np.concatenate((d_times + w_times, times), axis=1)

    ''' 4. Store cost function parameters '''
    X = times
    for i in params:
        X = np.concatenate(
            (X, np.array([[d[i] for d in data]])), axis=0).T
    return X, data


def f(X, weights=np.array([1e-1, 1])):
    X = X*weights
    # Let f be quadratic in time and linear in cost
    X[:, 0] = np.multiply(X[:, 0], abs(X[:, 0]))
    return np.sum(X, axis=1)


def opt(X, data, weights=np.array([1e-1, 1])):
    X_dev = X-X.mean(axis=0)
    Y = f(X_dev)
    optimal_index = list(Y).index(min(Y))
    optimal_spot_id = data[optimal_index]['spot_id']
    optimal_coord = str(data[optimal_index]['lng']) + \
        "," + str(data[optimal_index]['lat'])
    optimal_time = X[optimal_index, 0]
    optimal_price = X[optimal_index, 1]
    return optimal_spot_id, optimal_coord, optimal_time, optimal_price


def multi_spot(radii, origin, destination, car_size, params=['parking_price'], weights=np.array([1e-1, 1])):
    spot_list = [dict() for i in radii]
    for i in range(len(radii)):
        [X, data] = acquireX(origin, destination, radii[i],
                             car_size, params=['parking_price'])
        if X == []:
            continue
        [optimal_spot, coord, time, price] = opt(X, data)
        # print("Optimal spot: ", optimal_spot)
        # print("Price: $", price)
        # print("Time: ", round(time/60,2), " minutes")
        spot_list[i]["Optimal_spot_id"] = optimal_spot
        spot_list[i]["Price"] = price
        spot_list[i]["Time"] = time
        spot_list[i]["Coord"] = coord
    return spot_list