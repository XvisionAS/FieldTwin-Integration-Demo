# FieldTwin API Python Notebook Examples

This fieldtwin-api-demo.ipynb provides example python code
demonstrating how to access the FieldTwin REST API.

## How to run the example code

The examples in the notebook can be run using the python jupyter notebook environment. This provides a python runtime environment, where the code can be edited and run.   

There are a number of ways to do this.

## Run in Google Colab

Google Colab provides a free environment for storing and running python jupyter notebooks.
This can be accessed at https://colab.research.google.com/.

In the Colab web page: 
1. Select File -> Open notebook
2. Select the Github tab.
3. Paste in the github Url for this page.

This will create a link to the notebook which can be opened in the browser.

The python code in each cell can be run by clicking the 'run' button to the left of each cell. 

## Running in VS Code

VS code can be comfigured to run jupyter notebooks by installing the standard python and jupyter extensions provided by Microsoft.

To run the examples, it may be necessary to install the `requests` and `pandas` library modules.
```
pip install requests
pip install pandas
```
The `fieldtwin-api-demo.ipynb` file can then be downloaded from this repository and opened in VS Code.

The python code in each cell can be run by clicking the 'run' button to the left of each cell.

## API Token

In order to execute the FieldTwin API calls, it is necessary to obtain an API token from FutureOn. 
When the first cell in the notebook is run, it will provide a text box where the API token can be pasted and entered. This token is then used for the subsequent API calls in the following cells.

