import pandas as pd
from scipy import stats
import statsmodels.api as sm

def perform_hypothesis_tests(data_path):
    """
    Perform statistical hypothesis tests on the dataset.
    
    Args:
        data_path (str): Path to the CSV file
        
    Returns:
        dict: Dictionary containing test results
    """
    try:
        # Load the dataset
        df = pd.read_csv(data_path)

        # Select relevant columns and drop missing values
        df = df[['Price', 'Age_08_04', 'Fuel_Type', 'HP']].dropna()

        # Convert 'Fuel_Type' into dummy variables
        df = pd.get_dummies(df, columns=['Fuel_Type'], drop_first=True)

        results = {}

        # --- Statistical Hypothesis Test (T-Test) ---
        if 'Fuel_Type_Diesel' in df.columns and 'Fuel_Type_Petrol' in df.columns:
            diesel_prices = df[df['Fuel_Type_Diesel'] == 1]['Price']
            petrol_prices = df[df['Fuel_Type_Petrol'] == 1]['Price']

            t_stat, p_value = stats.ttest_ind(diesel_prices, petrol_prices)

            results['t_test'] = {
                't_statistic': round(t_stat, 4),
                'p_value': round(p_value, 4),
                'conclusion': "Reject H0" if p_value < 0.05 else "Fail to Reject H0"
            }

        # --- Complex Hypothesis Test (Multiple Linear Regression) ---
        X_columns = ['Age_08_04', 'HP']
        if 'Fuel_Type_Petrol' in df.columns:
            X_columns.append('Fuel_Type_Petrol')
        if 'Fuel_Type_CNG' in df.columns:
            X_columns.append('Fuel_Type_CNG')

        X = df[X_columns]
        y = df['Price']

        # Add constant to the model
        X = sm.add_constant(X)

        # Build and fit the regression model
        model = sm.OLS(y, X).fit()

        results['regression'] = {
            'summary': model.summary().as_text(),
            'r_squared': round(model.rsquared, 4),
            'adj_r_squared': round(model.rsquared_adj, 4),
            'f_statistic': round(model.fvalue, 4),
            'f_pvalue': round(model.f_pvalue, 4)
        }

        return results

    except Exception as e:
        return {'error': str(e)}

if __name__ == "__main__":
    # Example usage
    results = perform_hypothesis_tests("ToyotaCorolla (1).csv")
    print("\n=== Statistical Hypothesis Test (T-Test) ===")
    if 't_test' in results:
        print(f"T-Statistic: {results['t_test']['t_statistic']}")
        print(f"P-Value: {results['t_test']['p_value']}")
        print(f"Conclusion: {results['t_test']['conclusion']}")
    
    print("\n=== Complex Hypothesis Test (Multiple Linear Regression) ===")
    if 'regression' in results:
        print(f"R-squared: {results['regression']['r_squared']}")
        print(f"Adjusted R-squared: {results['regression']['adj_r_squared']}")
        print(f"F-statistic: {results['regression']['f_statistic']}")
        print(f"F-statistic p-value: {results['regression']['f_pvalue']}")
        print("\nDetailed Summary:")
        print(results['regression']['summary']) 