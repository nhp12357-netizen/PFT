import pandas as pd
import pickle
import os


df = pd.read_csv("transactions.csv")

df['date'] = pd.to_datetime(df['date'])

latest_date = df['date'].max()
months = pd.period_range(end=latest_date.to_period('M'), periods=3, freq='M')

df_filtered = df[df['date'].dt.to_period('M').isin(months) & (df['is_anomaly'] == 0)]

df_filtered['month'] = df_filtered['date'].dt.to_period('M')

monthly_totals = df_filtered.groupby(['category_id', 'month'])['amount'].sum().reset_index()

total_counts = df_filtered.groupby('category_id')['amount'].count().reset_index(name='total_count')

totals_pivot = monthly_totals.pivot(index='category_id', columns='month', values='amount')
totals_pivot = totals_pivot.reindex(columns=months, fill_value=0)

totals_pivot.columns = [f"month{i+1}_total" for i in range(totals_pivot.shape[1])]

totals_pivot['mean_3month'] = totals_pivot[[f"month{i+1}_total" for i in range(3)]].mean(axis=1)
totals_pivot['median_3month'] = totals_pivot[[f"month{i+1}_total" for i in range(3)]].median(axis=1)

totals_pivot['budget_rec'] = ((totals_pivot['mean_3month'] * 0.7) + (totals_pivot['median_3month'] * 0.3))
totals_pivot['budget_rec'] = (10 * (totals_pivot['budget_rec'] / 10).round()).astype(int)

results = totals_pivot.join(total_counts.set_index('category_id'))

category_map = {
    1: "Food & Dining",
    2: "Groceries",
    3: "Shopping",
    4: "Transportation",
    5: "Entertainment",
    6: "Rent",
    7: "Healthcare",
    8: "Investment"
}
results['category'] = results.index.map(category_map)

results = results[['category',
                   'month1_total','month2_total','month3_total',
                   'mean_3month','median_3month','budget_rec','total_count']]

results = results.fillna(0)

budget_dict = results.set_index('category')['budget_rec'].to_dict()

path = os.path.join("..", "..", "models/budget_rec.pkl")

os.makedirs(os.path.dirname(path), exist_ok=True)

# Save the pickle
with open(path, "wb") as f:
    pickle.dump(budget_dict, f)