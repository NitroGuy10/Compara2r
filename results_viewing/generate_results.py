from os.path import isfile


RESULTS_FILENAME = "results.json"
DATASET_FILENAME = "dataset.json"


if not isfile(RESULTS_FILENAME):
    print("Results JSON file not found. You can get it <your_compara2r_site>/results/<ADMIN_PASSWORD>. Then move it to this folder and rename it \"{}\".".format(RESULTS_FILENAME))
elif not isfile(DATASET_FILENAME):
    print("Dataset JSON file not found. You can get it <your_compara2r_site>/dataset/<ADMIN_PASSWORD>. Then move it to this folder and rename it \"{}\".".format(DATASET_FILENAME))
else:

    with open(RESULTS_FILENAME, "r") as results_file:
        with open(DATASET_FILENAME, "r") as dataset_file:
            pass


############################ READ TODO IN TRELLO!!!!!!!!!!!!!!!!!
