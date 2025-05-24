import sys
import json
import pandas as pd # type: ignore
from sklearn.linear_model import LinearRegression # type: ignore

# Read input from Node.js
raw_input = sys.stdin.read()
data = json.loads(raw_input)
df = pd.DataFrame(data)

# Process and predict
df['expense_date'] = pd.to_datetime(df['expense_date'])
df['month'] = df['expense_date'].dt.to_period('M')
grouped = df.groupby(['month', 'expense_type'])['amount'].sum().reset_index()
pivot = grouped.pivot(index='month', columns='expense_type', values='amount').fillna(0)

X = list(range(len(pivot)))
predictions = {}
for category in pivot.columns:
    y = pivot[category].values
    model = LinearRegression().fit([[x] for x in X], y)
    pred = model.predict([[len(pivot)]])[0]
    predictions[category] = round(pred, 2)

predictions['total'] = round(sum(predictions.values()), 2)

# Return result
print(json.dumps(predictions))
