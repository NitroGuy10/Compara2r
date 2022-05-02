from os.path import isfile
import json
import csv

VOTES_FILENAME = "votes.json"
DATASET_FILENAME = "dataset.json"

RESULTS_JSON_FILENAME = "results.json"
RESULTS_CSV_FILENAME = "results.csv"
RESULTS_HTML_FILENAME = "results.html"


def initialize_item(items_dict, dataset_list, item_num):
    if item_num < len(dataset_list):
        items_dict[item_num] = {
            "item_num": item_num,
            "item_contents": json.dumps(dataset_list[item_num]),
            "num_votes": 0,
            "num_passups": 0,
            "voters": {},
            "passup-ers": {}
        }
        return True
    else:
        print("Item number {} exceeds length of dataset ({}) ...I'll ignore it for now".format(item_num, len(dataset_list)))
        return False


if not isfile(VOTES_FILENAME):
    print("Votes JSON file not found. You can get it <your_compara2r_site>/votes/<ADMIN_PASSWORD>. Then move it to this folder and rename it \"{}\".".format(VOTES_FILENAME))
elif not isfile(DATASET_FILENAME):
    print("Dataset JSON file not found. You can get it <your_compara2r_site>/dataset/<ADMIN_PASSWORD>. Then move it to this folder and rename it \"{}\".".format(DATASET_FILENAME))
else:

    with open(VOTES_FILENAME, "r") as votes_file:
        with open(DATASET_FILENAME, "r") as dataset_file:
            votes = json.load(votes_file)
            dataset = json.load(dataset_file)

            items = {}

            for user in votes:
                # Completely ignore a user if they are blacklisted
                if user["blacklisted"]:
                    print(user["ip_hash"], "is blacklisted; let's ignore them")
                    continue

                # Count votes
                for vote_item_num in user["votes"]:
                    if vote_item_num not in items and not initialize_item(items, dataset, vote_item_num):
                        continue

                    items[vote_item_num]["num_votes"] += 1
                    if user["ip_hash"] in items[vote_item_num]["voters"]:
                        items[vote_item_num]["voters"][user["ip_hash"]] += 1
                    else:
                        items[vote_item_num]["voters"][user["ip_hash"]] = 1
                        
                # Count passups
                for passup_item_num in user["passups"]:
                    if passup_item_num not in items and not initialize_item(items, dataset, passup_item_num):
                        continue

                    items[passup_item_num]["num_passups"] += 1
                    if user["ip_hash"] in items[passup_item_num]["passup-ers"]:
                        items[passup_item_num]["passup-ers"][user["ip_hash"]] += 1
                    else:
                        items[passup_item_num]["passup-ers"][user["ip_hash"]] = 1
                
                # TODO flags (remember to only count them once per user)
                    
            

            # Honestly not really sure the best way to rank items
            sorted_items = sorted(items.values(), reverse=True, key=lambda item: item["num_votes"] - item["num_passups"])
            

            # Output everything
            if len(items) == 0:
                print("No items could be found!")
            else:
                # TODO mark if an item has a lot of flags

                with open(RESULTS_JSON_FILENAME, "w") as results_json_file:
                    json.dump(items, results_json_file)

                    print("Output", RESULTS_JSON_FILENAME)
            
                with open(RESULTS_CSV_FILENAME, "w") as results_csv_file:
                    writer = csv.DictWriter(results_csv_file, fieldnames=sorted_items[0].keys())

                    writer.writeheader()
                    writer.writerows(sorted_items)

                    print("Output", RESULTS_CSV_FILENAME)
